'use strict';

async function init() {
  const { apiKey, resume } = await chrome.storage.local.get(['apiKey', 'resume']);

  // API key status
  const apiDot  = document.getElementById('api-dot');
  const apiText = document.getElementById('api-text');
  if (apiKey) {
    apiDot.className  = 'status-dot dot-green';
    apiText.textContent = 'Connected ✓';
  } else {
    apiDot.className  = 'status-dot dot-red';
    apiText.textContent = 'Not set — click Settings';
  }

  // Resume status
  const resumeDot  = document.getElementById('resume-dot');
  const resumeText = document.getElementById('resume-text');
  if (resume && resume.length > 100) {
    resumeDot.className  = 'status-dot dot-green';
    resumeText.textContent = `Added (${Math.round(resume.length / 5)} words) ✓`;
  } else {
    resumeDot.className  = 'status-dot dot-red';
    resumeText.textContent = 'Not added — click Settings';
  }

  // Nav buttons
  document.getElementById('open-settings').onclick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/settings/settings.html') });
  };
  document.getElementById('open-tracker').onclick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/tracker/tracker.html') });
  };
  document.getElementById('open-linkedin').onclick = () => {
    chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/search/?keywords=AI+intern' });
  };
  document.getElementById('open-indeed').onclick = () => {
    chrome.tabs.create({ url: 'https://www.indeed.com/jobs?q=AI+intern' });
  };
}

init();
