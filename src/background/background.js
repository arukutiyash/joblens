'use strict';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_JOB') {
    analyzeJob(request.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async
  }
});

async function analyzeJob({ jobDescription, resume, company, role, university }) {
  const { apiKey } = await chrome.storage.local.get('apiKey');

  if (!apiKey) {
    throw new Error('No API key found. Please add your OpenAI API key in settings.');
  }

  const prompt = buildPrompt(jobDescription, resume, company, role);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are an expert career coach and ATS specialist helping students land tech internships. 
You analyze job descriptions against resumes and return structured JSON only. No markdown, no explanation outside the JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  // Strip markdown code fences if present
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function buildPrompt(jd, resume, company, role) {
  return `
Analyze this job description against the candidate's resume and return ONLY a valid JSON object with this exact structure:

{
  "matchScore": <number 0-100>,
  "matchLevel": <"Strong" | "Good" | "Weak">,
  "summary": {
    "whatRole": "<1 sentence: what this role actually does>",
    "whatTheywant": "<1 sentence: the core skills/experience they want>",
    "redFlag": "<1 sentence: any red flag or concern, or 'None' if all good>"
  },
  "missingKeywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<up to 8 missing skills/keywords>"],
  "strongMatches": ["<keyword1>", "<keyword2>", "<up to 6 strong matches>"],
  "coverLetter": "<A 3 paragraph professional cover letter tailored to this specific job and resume. Address it to Hiring Manager. Reference the company name and role. Keep it under 250 words.>",
  "atsAdvice": "<2-3 specific actionable tips to improve the resume for this specific job to pass ATS>"
}

COMPANY: ${company || 'Unknown'}
ROLE: ${role || 'Unknown'}

JOB DESCRIPTION:
${jd.slice(0, 4000)}

CANDIDATE RESUME:
${resume.slice(0, 3000)}

Return only the JSON object. No other text.
`;
}
