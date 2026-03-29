const form = document.getElementById('lookup-form');
const urlInput = document.getElementById('url');
const tsInput = document.getElementById('timestamp');
const result = document.getElementById('result');

function setLoading(isLoading){
  const btn = form.querySelector('button');
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Checking…' : 'Check Wayback';
}

function renderMessage(html){
  result.innerHTML = html;
}

async function queryWayback(targetUrl, timestamp){
  const base = 'https://archive.org/wayback/available';
  const params = new URLSearchParams({url: targetUrl});
  if(timestamp) params.set('timestamp', timestamp);
  const url = `${base}?${params.toString()}`;

  const res = await fetch(url, {cache: 'no-store'});
  if(!res.ok) throw new Error(`Network error: ${res.status}`);
  return res.json();
}

function renderResult(data, targetUrl, timestamp){
  const snaps = data && data.archived_snapshots && data.archived_snapshots.closest;
  if(!snaps){
    renderMessage(`<div class="muted">No archived snapshot available for <strong>${escapeHtml(targetUrl)}</strong>.</div>`);
    return;
  }

  const available = snaps.available;
  if(!available){
    renderMessage(`<div class="muted">Wayback returned no accessible snapshot for <strong>${escapeHtml(targetUrl)}</strong>.</div>`);
    return;
  }

  const link = snaps.url;
  const stamp = snaps.timestamp || '';
  const status = snaps.status || '';

  renderMessage(`
    <div class="snapshot">
      <div><strong>Snapshot:</strong> <a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></div>
      <div class="muted">Timestamp: ${stamp} &nbsp; • &nbsp; HTTP status: ${status}</div>
    </div>
  `);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

form.addEventListener('submit', async (ev) =>{
  ev.preventDefault();
  const targetUrl = urlInput.value.trim();
  const timestamp = tsInput.value.trim();
  if(!targetUrl) return;

  setLoading(true);
  renderMessage('');
  try{
    const data = await queryWayback(targetUrl, timestamp || undefined);
    renderResult(data, targetUrl, timestamp);
  }catch(err){
    renderMessage(`<div class="muted">Error: ${escapeHtml(err.message)}</div>`);
  }finally{
    setLoading(false);
  }
});

// allow Enter on inputs
urlInput.addEventListener('keydown', e => { if(e.key === 'Enter') form.requestSubmit(); });
tsInput.addEventListener('keydown', e => { if(e.key === 'Enter') form.requestSubmit(); });
