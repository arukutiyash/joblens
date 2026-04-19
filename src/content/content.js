'use strict';

// ─── Extract job data from the current page ───────────────────────────────

function extractJobData() {
  const url = window.location.href;
  let jd = '', company = '', role = '';

  if (url.includes('linkedin.com')) {
    jd      = document.querySelector('.jobs-description__content, .job-view-layout, [class*="description"]')?.innerText || '';
    company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .topcard__org-name-link')?.innerText?.trim() || '';
    role    = document.querySelector('.job-details-jobs-unified-top-card__job-title, .topcard__title')?.innerText?.trim() || '';
  } else if (url.includes('indeed.com')) {
    jd      = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.innerText || '';
    company = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-CompanyInfoContainer')?.innerText?.trim() || '';
    role    = document.querySelector('.jobsearch-JobInfoHeader-title, h1.jobTitle')?.innerText?.trim() || '';
  }

  return { jd, company, role };
}

// ─── Build LinkedIn people finder URLs ────────────────────────────────────

function buildPeopleURLs(company, role, university) {
  const encode = str => encodeURIComponent(str);
  const baseRole = role.split(' ').slice(0, 3).join(' '); // keep short

  const currentEmployees = `https://www.linkedin.com/search/results/people/?keywords=${encode(baseRole)}&currentCompany=${encode(company)}&origin=FACETED_SEARCH`;
  const alumni = university
    ? `https://www.linkedin.com/search/results/people/?keywords=${encode(company + ' ' + baseRole)}&schoolFilter=${encode(university)}&origin=FACETED_SEARCH`
    : null;
  const hiringManager = `https://www.linkedin.com/search/results/people/?keywords=${encode('hiring manager ' + baseRole + ' ' + company)}&origin=GLOBAL_SEARCH_HEADER`;

  return { currentEmployees, alumni, hiringManager };
}

// ─── Inject the sidebar into the page ─────────────────────────────────────

function injectSidebar() {
  if (document.getElementById('joblens-sidebar')) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'joblens-sidebar';
  sidebar.innerHTML = `
    <div id="joblens-header">
      <span id="joblens-logo">JobLens</span>
      <span id="joblens-beta">AI</span>
      <button id="joblens-close">✕</button>
    </div>
    <div id="joblens-body">
      <div id="joblens-idle">
        <p class="jl-hint">Click <strong>Analyze Job</strong> to get your ATS score, summary, skill gaps, cover letter and people finder.</p>
        <button id="joblens-analyze-btn" class="jl-btn-primary">Analyze this job</button>
      </div>
      <div id="joblens-loading" style="display:none;">
        <div class="jl-spinner"></div>
        <p class="jl-hint">Analyzing with AI...</p>
      </div>
      <div id="joblens-error" style="display:none;">
        <p class="jl-error-msg"></p>
        <button class="jl-btn-secondary" id="joblens-retry">Try again</button>
        <button class="jl-btn-ghost" id="joblens-settings-link">Open settings</button>
      </div>
      <div id="joblens-results" style="display:none;"></div>
    </div>
  `;
  document.body.appendChild(sidebar);

  // Toggle button
  const toggle = document.createElement('button');
  toggle.id = 'joblens-toggle';
  toggle.innerHTML = '🔍';
  toggle.title = 'Open JobLens';
  document.body.appendChild(toggle);

  // Events
  document.getElementById('joblens-close').onclick = () => {
    sidebar.classList.remove('open');
  };
  toggle.onclick = () => {
    sidebar.classList.toggle('open');
  };
  document.getElementById('joblens-analyze-btn').onclick = runAnalysis;
  document.getElementById('joblens-retry')?.addEventListener('click', runAnalysis);
  document.getElementById('joblens-settings-link')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
  });

  // Auto open when injected
  sidebar.classList.add('open');
}

// ─── Run the full analysis ─────────────────────────────────────────────────

async function runAnalysis() {
  showState('loading');

  const { jd, company, role } = extractJobData();

  if (!jd || jd.length < 100) {
    showError('Could not extract job description from this page. Try scrolling down to load the full job first, then click Analyze again.');
    return;
  }

  const stored = await chrome.storage.local.get(['resume', 'apiKey', 'university']);

  if (!stored.apiKey) {
    showError('No OpenAI API key found. Please add it in JobLens settings.');
    return;
  }
  if (!stored.resume) {
    showError('No resume found. Please paste your resume in JobLens settings.');
    return;
  }

  chrome.runtime.sendMessage({
    type: 'ANALYZE_JOB',
    payload: {
      jobDescription: jd,
      resume: stored.resume,
      company,
      role,
      university: stored.university || ''
    }
  }, (response) => {
    if (response.success) {
      renderResults(response.data, company, role, stored.university);
    } else {
      showError(response.error || 'Something went wrong. Please try again.');
    }
  });
}

// ─── Render results ────────────────────────────────────────────────────────

function renderResults(data, company, role, university) {
  const urls = buildPeopleURLs(company, role, university);

  const scoreColor = data.matchScore >= 75 ? '#1D9E75'
    : data.matchScore >= 50 ? '#BA7517'
    : '#E24B4A';

  const missingTags = (data.missingKeywords || [])
    .map(k => `<span class="jl-tag jl-tag-missing">${k}</span>`).join('');

  const matchTags = (data.strongMatches || [])
    .map(k => `<span class="jl-tag jl-tag-match">${k}</span>`).join('');

  document.getElementById('joblens-results').innerHTML = `

    <!-- Score -->
    <div class="jl-section">
      <div class="jl-score-ring" style="--score-color:${scoreColor}">
        <span class="jl-score-num">${data.matchScore}%</span>
        <span class="jl-score-label">${data.matchLevel} Match</span>
      </div>
    </div>

    <!-- Summary -->
    <div class="jl-section">
      <div class="jl-section-title">JD Summary</div>
      <div class="jl-summary-row"><span class="jl-pill jl-pill-blue">Role</span> ${data.summary?.whatRole || '—'}</div>
      <div class="jl-summary-row"><span class="jl-pill jl-pill-green">Wants</span> ${data.summary?.whatTheywant || '—'}</div>
      <div class="jl-summary-row"><span class="jl-pill jl-pill-red">Flag</span> ${data.summary?.redFlag || 'None'}</div>
    </div>

    <!-- Keywords -->
    <div class="jl-section">
      <div class="jl-section-title">Missing Keywords <span class="jl-hint-small">(add these to your resume)</span></div>
      <div class="jl-tags">${missingTags || '<span class="jl-hint-small">None — great match!</span>'}</div>
    </div>

    <div class="jl-section">
      <div class="jl-section-title">Strong Matches</div>
      <div class="jl-tags">${matchTags || '<span class="jl-hint-small">—</span>'}</div>
    </div>

    <!-- ATS Advice -->
    <div class="jl-section">
      <div class="jl-section-title">ATS Tips</div>
      <div class="jl-advice">${data.atsAdvice || '—'}</div>
    </div>

    <!-- People Finder -->
    <div class="jl-section">
      <div class="jl-section-title">People Finder — ${company || 'this company'}</div>
      <a class="jl-people-link" href="${urls.currentEmployees}" target="_blank">
        Current ${role ? role.split(' ').slice(0,2).join(' ') : 'employees'} at ${company || 'company'} →
      </a>
      ${urls.alumni ? `<a class="jl-people-link" href="${urls.alumni}" target="_blank">Your university alumni at ${company || 'company'} →</a>` : '<p class="jl-hint-small">Add your university in settings to find alumni.</p>'}
      <a class="jl-people-link" href="${urls.hiringManager}" target="_blank">Find hiring manager →</a>
    </div>

    <!-- Cover Letter -->
    <div class="jl-section">
      <div class="jl-section-title">Cover Letter Draft
        <button class="jl-copy-btn" id="jl-copy-cover">Copy</button>
      </div>
      <div class="jl-cover" id="jl-cover-text">${(data.coverLetter || '').replace(/\n/g, '<br>')}</div>
    </div>

    <button class="jl-btn-secondary" id="joblens-reanalyze" style="margin-top:8px;width:100%;">Re-analyze</button>
  `;

  showState('results');

  // Copy cover letter
  document.getElementById('jl-copy-cover')?.addEventListener('click', () => {
    navigator.clipboard.writeText(data.coverLetter || '');
    document.getElementById('jl-copy-cover').textContent = 'Copied!';
    setTimeout(() => {
      const btn = document.getElementById('jl-copy-cover');
      if (btn) btn.textContent = 'Copy';
    }, 2000);
  });

  document.getElementById('joblens-reanalyze')?.addEventListener('click', runAnalysis);
}

// ─── UI state helpers ──────────────────────────────────────────────────────

function showState(state) {
  ['idle', 'loading', 'error', 'results'].forEach(s => {
    const el = document.getElementById(`joblens-${s}`);
    if (el) el.style.display = s === state ? 'block' : 'none';
  });
}

function showError(msg) {
  showState('error');
  const el = document.querySelector('.jl-error-msg');
  if (el) el.textContent = msg;
}

// ─── Boot ──────────────────────────────────────────────────────────────────

injectSidebar();
