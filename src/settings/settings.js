'use strict';

async function loadSaved() {
  const { apiKey, resume, university } = await chrome.storage.local.get(['apiKey', 'resume', 'university']);
  if (apiKey)     document.getElementById('api-key').value    = apiKey;
  if (resume)     document.getElementById('resume').value     = resume;
  if (university) document.getElementById('university').value = university;
}

function showSaved(id) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

document.getElementById('save-api').onclick = async () => {
  const apiKey = document.getElementById('api-key').value.trim();
  if (!apiKey) return alert('Please enter your API key.');
  await chrome.storage.local.set({ apiKey });
  showSaved('api-saved');
};

document.getElementById('save-resume').onclick = async () => {
  const resume = document.getElementById('resume').value.trim();
  if (!resume || resume.length < 50) return alert('Please paste your full resume.');
  await chrome.storage.local.set({ resume });
  showSaved('resume-saved');
};

document.getElementById('save-university').onclick = async () => {
  const university = document.getElementById('university').value.trim();
  await chrome.storage.local.set({ university });
  showSaved('university-saved');
};

loadSaved();
