# JobLens — AI Job Assistant Chrome Extension

> ATS match score · JD summary · Skill gaps · Cover letter · People finder

Built for MS AI students and new grads to land internships faster.

---

## How to load in Chrome (Development mode)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the `joblens` folder
5. JobLens is now installed!

---

## First time setup

1. Click the JobLens icon in your Chrome toolbar
2. Click **Settings**
3. Add your **OpenAI API key** (get one free at platform.openai.com/api-keys)
4. Paste your **resume** as plain text
5. Add your **university name** (for alumni finder)
6. Save each section

---

## How to use

1. Go to any LinkedIn or Indeed job page
2. The JobLens sidebar appears automatically (or click the 🔍 button on the right)
3. Click **Analyze this job**
4. Get your ATS score, missing keywords, JD summary, cover letter, and people finder links

---

## Features

- **ATS Match Score** — 0-100% score showing how well your resume matches
- **Missing Keywords** — exact skills the JD wants that you don't have on your resume
- **JD Summary** — 3-line plain English summary of any job description
- **Cover Letter** — one-click tailored cover letter draft
- **People Finder** — LinkedIn search links for current employees and university alumni
- **Application Tracker** — track all your applications with status

---

## Cost

Each job analysis costs ~$0.001 using your own OpenAI API key (gpt-4o-mini).
100 job analyses = ~$0.10. Essentially free.

---

## Tech stack

- Manifest V3 Chrome Extension
- Vanilla JS + HTML + CSS (no framework)
- OpenAI gpt-4o-mini API
- chrome.storage.local (all data stays in your browser)

---

## Privacy

Your resume and API key are stored **only in your browser** using chrome.storage.local.
They are never sent to any server except directly to OpenAI for analysis.
