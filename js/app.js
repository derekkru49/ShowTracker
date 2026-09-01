(function () {
  const seed = window.SHOWTRACKER_DATA;
  const saved = JSON.parse(localStorage.getItem('showtracker-shows') || 'null');
  let shows = Array.isArray(saved) ? saved : seed;
  let state = { query: '', status: 'all', service: 'All services' };
  const grid = document.getElementById('showGrid');
  const dialog = document.getElementById('showDialog');

  const serviceIcons = { 'Netflix': 'N', 'Max': 'max', 'Apple TV+': '●tv+', 'Hulu': 'hulu', 'Prime Video': 'prime', 'Disney+': 'Disney+' };
  const serviceClass = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const save = () => localStorage.setItem('showtracker-shows', JSON.stringify(shows));
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function services() { return ['All services', ...new Set(shows.map(s => s.service))]; }
  function visibleShows() {
    return shows.filter(show => (state.status === 'all' || show.status === state.status) && (state.service === 'All services' || show.service === state.service) && (`${show.title} ${show.genre}`.toLowerCase().includes(state.query.toLowerCase())));
  }
  function progress(show) { return show.status === 'finished' ? 100 : Math.round((show.episode / show.totalEpisodes) * 100); }

  function renderServices() {
    document.getElementById('serviceFilters').innerHTML = services().map(service => `<button class="service-chip ${state.service === service ? 'active' : ''}" data-service="${service}">${service === 'All services' ? 'All services' : `<b class="service-icon ${serviceClass(service)}">${serviceIcons[service] || service[0]}</b>${service}`}</button>`).join('');
  }
  function renderCounts() {
    document.getElementById('allCount').textContent = shows.length;
    ['watching','up-next','finished'].forEach(status => document.getElementById(status === 'up-next' ? 'upNextCount' : `${status}Count`).textContent = shows.filter(s => s.status === status).length);
  }
  function card(show) {
    const pct = progress(show); const finished = show.status === 'finished'; const upcoming = show.status === 'up-next';
    return `<article class="show-card" data-id="${show.id}" tabindex="0">
      <div class="poster poster-${show.poster % 6}"><div class="poster-shade"></div><span class="score">★ ${show.rating}</span><div class="poster-title"><span>${show.genre}</span><strong>${escapeHtml(show.title)}</strong></div><button class="more-btn" aria-label="Open ${escapeHtml(show.title)} details">•••</button></div>
      <div class="card-body">
        <div class="title-row"><div><h3>${escapeHtml(show.title)}</h3><p>${show.year} · ${show.genre}</p></div><b class="service-icon ${serviceClass(show.service)}">${serviceIcons[show.service] || show.service[0]}</b></div>
        <div class="progress-meta"><span>${finished ? 'Completed' : upcoming ? 'Ready to start' : `Season ${show.season} · Episode ${show.episode}`}</span><strong>${pct}%</strong></div>
        <div class="progress-track"><i style="width:${pct}%"></i></div>
        <button class="continue-btn ${finished ? 'finished' : ''}" data-action="progress">${finished ? '<span>✓</span> Watched' : upcoming ? '<span>▶</span> Start watching' : '<span>▶</span> Continue watching'}</button>
      </div></article>`;
  }
  function render() {
    const items = visibleShows();
    grid.innerHTML = items.map(card).join('');
    document.getElementById('resultsCount').textContent = `${items.length} ${items.length === 1 ? 'show' : 'shows'}`;
    document.getElementById('emptyState').hidden = items.length > 0;
    renderCounts(); renderServices();
  }

  function openDetails(show) {
    document.getElementById('dialogContent').innerHTML = `<button class="modal-close" data-close aria-label="Close">×</button><div class="detail-hero poster poster-${show.poster % 6}"><div class="poster-shade"></div><div class="detail-title"><p>${show.genre} · ${show.year}</p><h2>${escapeHtml(show.title)}</h2></div></div><div class="detail-body"><div class="detail-service"><b class="service-icon ${serviceClass(show.service)}">${serviceIcons[show.service] || show.service[0]}</b><div><small>NOW STREAMING ON</small><strong>${show.service}</strong></div><span>★ ${show.rating}</span></div><p>${escapeHtml(show.description)}</p><div class="episode-stepper"><button data-step="-1" aria-label="Previous episode">−</button><div><small>YOUR PROGRESS</small><strong>Season ${show.season} · Episode ${show.episode}</strong></div><button data-step="1" aria-label="Next episode">＋</button></div><button class="submit-btn" data-close>Done</button></div>`;
    dialog.dataset.id = show.id; dialog.showModal();
  }
  function updateEpisode(id, delta) {
    const show = shows.find(s => s.id === id); if (!show) return;
    show.episode = Math.max(0, Math.min(show.totalEpisodes, show.episode + delta));
    show.status = show.episode === show.totalEpisodes ? 'finished' : show.episode === 0 ? 'up-next' : 'watching'; save(); render(); openDetails(show);
  }
  function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2200); }

  document.getElementById('statusFilters').addEventListener('click', e => { const btn = e.target.closest('[data-status]'); if (!btn) return; state.status = btn.dataset.status; document.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active', b === btn)); render(); });
  document.getElementById('serviceFilters').addEventListener('click', e => { const btn = e.target.closest('[data-service]'); if (!btn) return; state.service = btn.dataset.service; render(); });
  document.getElementById('searchInput').addEventListener('input', e => { state.query = e.target.value; render(); });
  grid.addEventListener('click', e => { const cardEl = e.target.closest('.show-card'); if (!cardEl) return; const show = shows.find(s => s.id === cardEl.dataset.id); if (e.target.closest('[data-action="progress"]')) { if (show.status === 'finished') return toast('Already completed — nice work!'); show.episode = Math.min(show.totalEpisodes, show.episode + 1); show.status = show.episode === show.totalEpisodes ? 'finished' : 'watching'; save(); render(); toast(`Marked episode ${show.episode} watched`); } else openDetails(show); });
  grid.addEventListener('keydown', e => { if (e.key === 'Enter') openDetails(shows.find(s => s.id === e.target.dataset.id)); });
  dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('[data-close]')) dialog.close(); const step = e.target.closest('[data-step]'); if (step) { dialog.close(); updateEpisode(dialog.dataset.id, Number(step.dataset.step)); } });
  document.getElementById('addShowBtn').addEventListener('click', () => document.getElementById('addDialog').showModal());
  document.getElementById('addDialog').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.closest('[data-close]')) e.currentTarget.close(); });
  document.getElementById('addForm').addEventListener('submit', e => { e.preventDefault(); const data = new FormData(e.target); const title = data.get('title').trim(); shows.unshift({ id: `${Date.now()}`, title, year: new Date().getFullYear(), genre: 'Drama', service: data.get('service'), status: 'up-next', season: 1, episode: 0, totalEpisodes: Number(data.get('totalEpisodes')), rating: '—', poster: shows.length % 6, description: data.get('description') || 'A new show on your watchlist.' }); save(); e.target.reset(); document.getElementById('addDialog').close(); state.status='all'; document.querySelectorAll('[data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status==='all')); render(); toast(`${title} added to your watchlist`); });
  document.querySelectorAll('[data-toast]').forEach(el => el.addEventListener('click', () => toast(el.dataset.toast)));
  document.getElementById('themeToggle').addEventListener('click', () => { document.body.classList.toggle('light'); localStorage.setItem('showtracker-theme', document.body.classList.contains('light') ? 'light' : 'dark'); });
  if (localStorage.getItem('showtracker-theme') === 'light') document.body.classList.add('light');
  document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('searchInput').focus(); } });
  render();
})();

