'use strict';

async function loadTracker() {
  const { applications = [] } = await chrome.storage.local.get('applications');
  const content = document.getElementById('tracker-content');

  // Stats
  const interviews = applications.filter(a => a.status === 'Interview').length;
  const offers     = applications.filter(a => a.status === 'Offer').length;
  const avgScore   = applications.length
    ? Math.round(applications.reduce((s, a) => s + (a.score || 0), 0) / applications.length)
    : 0;

  document.getElementById('stat-total').textContent     = applications.length;
  document.getElementById('stat-interview').textContent = interviews;
  document.getElementById('stat-avg').textContent       = avgScore + '%';
  document.getElementById('stat-offer').textContent     = offers;

  if (!applications.length) {
    content.innerHTML = `<div class="empty">No applications saved yet.<br>Open a LinkedIn or Indeed job page, analyze it with JobLens,<br>and click "Save this job" to track it here.</div>`;
    return;
  }

  const rows = applications.map((app, i) => {
    const scoreClass = app.score >= 75 ? 'score-high' : app.score >= 50 ? 'score-mid' : 'score-low';
    return `
      <tr>
        <td><strong>${app.company || '—'}</strong></td>
        <td>${app.role || '—'}</td>
        <td class="${scoreClass}">${app.score || '—'}%</td>
        <td>
          <select onchange="updateStatus(${i}, this.value)" style="border:none;background:transparent;font-size:12px;cursor:pointer;">
            ${['Applied','Interview','Rejected','Offer'].map(s =>
              `<option ${app.status === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
          <span class="status-badge status-${app.status}">${app.status}</span>
        </td>
        <td>${app.date || '—'}</td>
        <td><button class="btn-delete" onclick="deleteApp(${i})">✕</button></td>
      </tr>
    `;
  }).join('');

  content.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Company</th><th>Role</th><th>Match</th><th>Status</th><th>Date</th><th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

window.updateStatus = async (index, status) => {
  const { applications = [] } = await chrome.storage.local.get('applications');
  applications[index].status = status;
  await chrome.storage.local.set({ applications });
  loadTracker();
};

window.deleteApp = async (index) => {
  const { applications = [] } = await chrome.storage.local.get('applications');
  applications.splice(index, 1);
  await chrome.storage.local.set({ applications });
  loadTracker();
};

loadTracker();
