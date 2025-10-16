// notyet.js
// Attach this file to your notyet.html (e.g. <script src="/public/js/notyet.js"></script>)
// Behavior: show a "Loading..." state, then a "Loading failed" state, then reveal
// a friendly message such as "It seems this page does not exist."

(function () {
  'use strict';

  // Configuration: adjust timings as desired (ms)
  const LOAD_TIME = 1800;      // how long the "loading" state lasts
  const FAIL_DELAY = 700;      // pause between "failed" and final message

  // CSS injected so the script works without extra stylesheets
  const injectedStyles = `
  #notyet-root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    color: #222;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 55vh;
    padding: 28px;
    box-sizing: border-box;
  }
  .notyet-card {
    text-align: center;
    max-width: 520px;
    width: 100%;
    border-radius: 12px;
    padding: 28px;
    background: #fff;
    box-shadow: 0 6px 22px rgba(0,0,0,0.08);
  }
  .notyet-status {
    display:flex;
    align-items:center;
    justify-content:center;
    gap:12px;
    font-size: 18px;
    margin-bottom: 14px;
  }
  .spinner {
    width:22px;
    height:22px;
    border-radius:50%;
    border:3px solid #cfd8dc;
    border-top-color: #1976d2;
    animation: spin 900ms linear infinite;
    flex: 0 0 22px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status-failed .spinner { display:none; }
  .status-failed .failed-icon { display:inline-flex; }
  .failed-icon {
    display:none;
    width:22px;
    height:22px;
    align-items:center;
    justify-content:center;
    color:#b71c1c;
    font-weight:700;
    font-size:18px;
    flex: 0 0 22px;
  }
  .status-text {
    font-weight:600;
    color:#37474f;
  }
  .status-text.fail {
    color:#b71c1c;
  }
  .final-message{
    margin-top:10px;
    color:#455a64;
    font-size:15px;
  }
  .final-message a{
    color:#1976d2;
    text-decoration:none;
    font-weight:600;
    margin-left:6px;
  }
  .action-row {
    margin-top:18px;
    display:flex;
    gap:10px;
    justify-content:center;
  }
  .btn {
    padding:8px 14px;
    border-radius:8px;
    border:1px solid #cfd8dc;
    background:#fff;
    cursor:pointer;
    font-weight:600;
    color:#263238;
  }
  .btn.primary {
    background:#1976d2;
    color:white;
    border-color: #1976d2;
  }
  `;

  function injectStyles(css) {
    const s = document.createElement('style');
    s.setAttribute('type', 'text/css');
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function buildUI(root) {
    const card = document.createElement('div');
    card.className = 'notyet-card';
    card.innerHTML = `
      <div class="notyet-status" id="notyet-status">
        <div class="spinner" aria-hidden="true"></div>
        <div class="failed-icon" aria-hidden="true">✖</div>
        <div class="status-text" id="notyet-status-text">Loading…</div>
      </div>
      <div class="final-message" id="notyet-final" aria-live="polite" style="display:none;">
        It seems this page does not exist.
        <a href="/" id="notyet-home">Go to homepage</a>
      </div>
      <div class="action-row" id="notyet-actions" style="display:none;">
        <button class="btn" id="notyet-retry">Retry</button>
        <button class="btn primary" id="notyet-home-btn">Go home</button>
      </div>
    `;
    root.appendChild(card);

    return {
      statusEl: card.querySelector('#notyet-status'),
      statusTextEl: card.querySelector('#notyet-status-text'),
      spinnerEl: card.querySelector('.spinner'),
      failedIconEl: card.querySelector('.failed-icon'),
      finalMessageEl: card.querySelector('#notyet-final'),
      actionsEl: card.querySelector('#notyet-actions'),
      retryBtn: card.querySelector('#notyet-retry'),
      homeBtn: card.querySelector('#notyet-home-btn'),
    };
  }

  function showLoading(ui) {
    ui.statusEl.classList.remove('status-failed');
    ui.statusTextEl.classList.remove('fail');
    ui.statusTextEl.textContent = 'Loading…';
    ui.spinnerEl.style.display = '';
    ui.failedIconEl.style.display = 'none';
    ui.finalMessageEl.style.display = 'none';
    ui.actionsEl.style.display = 'none';
  }

  function showFailed(ui) {
    ui.statusEl.classList.add('status-failed');
    ui.statusTextEl.classList.add('fail');
    ui.statusTextEl.textContent = 'Loading failed';
    ui.spinnerEl.style.display = 'none';
    ui.failedIconEl.style.display = 'inline-flex';
  }

  function showFinalMessage(ui) {
    ui.finalMessageEl.style.display = '';
    ui.actionsEl.style.display = '';
  }

  // Initialize once DOM ready
  function init() {
    injectStyles(injectedStyles);

    // find an existing placeholder in notyet.html or attach to body
    let root = document.getElementById('notyet-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'notyet-root';
      // Place near top of body for visibility
      document.body.insertBefore(root, document.body.firstChild);
    }

    const ui = buildUI(root);
    showLoading(ui);

    // simulate a loading step, then fail, then reveal message
    const loadTimer = setTimeout(() => {
      showFailed(ui);

      const finalTimer = setTimeout(() => {
        showFinalMessage(ui);
      }, FAIL_DELAY);

      // keep references so we could clear if needed
      ui._timers = [finalTimer];
    }, LOAD_TIME);

    // store timer for potential reuse
    ui._timers = ui._timers || [];
    ui._timers.unshift(loadTimer);

    // wire actions
    ui.retryBtn.addEventListener('click', function () {
      // simple retry: restart sequence
      ui._timers.forEach(t => clearTimeout(t));
      showLoading(ui);
      const t1 = setTimeout(() => {
        showFailed(ui);
        const t2 = setTimeout(() => showFinalMessage(ui), FAIL_DELAY);
        ui._timers = [t2];
      }, LOAD_TIME);
      ui._timers = [t1];
    });

    ui.homeBtn.addEventListener('click', function () {
      window.location.href = '/';
    });

    // optional: allow link in message to go home and be keyboard accessible
    const homeLink = document.getElementById('notyet-home');
    if (homeLink) homeLink.addEventListener('click', () => { /* regular navigation */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
