/* V11 on-page panel. Extension iframe isolates the answer UI from Pearson styles. */
(() => {
  if (window.top !== window || globalThis.__melV11Panel) return;
  globalThis.__melV11Panel = true;
  const host = document.createElement('mel-answer-root');
  host.style.cssText = 'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646';
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host{all:initial}*{box-sizing:border-box}[hidden]{display:none!important}
    .panel{position:fixed;right:14px;bottom:14px;width:min(440px,calc(100vw - 24px));height:min(82vh,850px);display:flex;flex-direction:column;border:1px solid #d9e0ea;border-radius:12px;overflow:hidden;background:#f6f8fb;box-shadow:0 16px 40px #0f172a40;font:14px system-ui}
    .head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;background:#176b5b;color:white;cursor:move;touch-action:none;user-select:none}.head strong{font-size:13px}.head button{border:1px solid #ffffff55;border-radius:6px;background:#ffffff15;color:white;height:28px;min-width:30px;cursor:pointer}
    iframe{width:100%;flex:1;min-height:0;border:0;background:#f6f8fb}.bubble{position:fixed;right:0;top:42vh;border:0;border-radius:10px 0 0 10px;background:#176b5b;color:white;font:bold 13px system-ui;padding:15px 10px;box-shadow:0 6px 18px #0003;cursor:pointer}
  </style><section class="panel" hidden aria-label="MyEnglishLab Solver"><div class="head"><strong>MyEnglishLab Solver</strong><button title="Thu nhỏ" aria-label="Thu nhỏ">−</button></div></section><button class="bubble" title="Mở bảng đáp án (Alt+Shift+M)">EN</button>`;
  document.documentElement.append(host);
  const panel = root.querySelector('.panel'), bubble = root.querySelector('.bubble'), head = root.querySelector('.head');
  function show(open) {
    panel.hidden = !open; bubble.hidden = open;
    if (open && !panel.querySelector('iframe')) { const frame = document.createElement('iframe'); frame.title = 'Kho đáp án Unit 1–10'; frame.src = chrome.runtime.getURL('popup.html?panel=1'); panel.append(frame); }
  }
  bubble.addEventListener('click',() => show(true)); head.querySelector('button').addEventListener('click',() => show(false));
  chrome.runtime.onMessage.addListener(msg => { if (msg?.type === 'MEL_SHOW_PANEL') show(msg.toggle ? panel.hidden : true); });
  head.addEventListener('pointerdown',e => {
    if (e.target.closest('button')) return;
    const rect = panel.getBoundingClientRect(), dx = e.clientX-rect.x, dy=e.clientY-rect.y;
    head.setPointerCapture(e.pointerId);
    const move = ev => { panel.style.left = Math.min(Math.max(0,ev.clientX-dx),Math.max(0,innerWidth-panel.offsetWidth))+'px'; panel.style.top = Math.min(Math.max(0,ev.clientY-dy),Math.max(0,innerHeight-panel.offsetHeight))+'px'; panel.style.right='auto'; panel.style.bottom='auto'; };
    const stop = () => { head.removeEventListener('pointermove',move); head.removeEventListener('pointerup',stop); head.removeEventListener('pointercancel',stop); };
    head.addEventListener('pointermove',move); head.addEventListener('pointerup',stop); head.addEventListener('pointercancel',stop);
  });
  window.addEventListener('resize',() => { panel.style.left='';panel.style.top='';panel.style.right='';panel.style.bottom=''; });
})();
