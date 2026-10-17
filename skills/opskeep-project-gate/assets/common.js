const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

function lum(hex) {
  const h = String(hex).replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const v = [0, 2, 4].map(i => parseInt(f.substr(i, 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4));
  return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
}

/* Wireframe preview drawn from a small spec: nav, density(1-3), radius, surface, palette, serif/mono, title */
function miniPreview(s) {
  s = s || {};
  const P = Object.assign({bg:'#f6f7f9', surface:'#ffffff', accent:'#2f6feb', ink:'#1b1f24', line:'#dfe3e8'}, s.palette || {});
  const W = 200, H = 125;
  const r = Math.max(0, Math.min(s.radius == null ? 6 : s.radius, 14));
  const nav = s.nav || 'top', dens = s.density || 2, surf = s.surface || 'flat';
  const f = (x, y, w, h, fill, o) => {
    o = o || {};
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r || 0}" fill="${fill}"` +
      (o.stroke ? ` stroke="${o.stroke}" stroke-width="1"` : '') + (o.op != null ? ` opacity="${o.op}"` : '') + '/>';
  };
  let g = f(0, 0, W, H, P.bg, {r: 6});
  let x0 = 10, y0 = 10, x1 = W - 10, y1 = H - 10;
  if (nav === 'sidebar') {
    g += f(0, 0, 36, H, P.surface, {stroke: P.line}) + f(8, 10, 10, 10, P.accent, {r: 3});
    for (let i = 0; i < 5; i++) g += f(8, 30 + i * 13, 20, 5, P.ink, {r: 2, op: i === 1 ? .9 : .25});
    x0 = 46;
  } else if (nav === 'top') {
    g += f(0, 0, W, 18, P.surface, {stroke: P.line}) + f(8, 5, 8, 8, P.accent, {r: 3});
    for (let i = 0; i < 3; i++) g += f(60 + i * 22, 7, 16, 4, P.ink, {r: 2, op: i === 0 ? .9 : .25});
    y0 = 26;
  } else if (nav === 'tabs') {
    g += f(0, H - 20, W, 20, P.surface, {stroke: P.line});
    for (let i = 0; i < 4; i++) g += f(24 + i * 40, H - 13, 10, 6, i === 0 ? P.accent : P.ink, {r: 2, op: i === 0 ? 1 : .3});
    y1 = H - 28;
  }
  const font = s.serif ? 'Georgia,serif' : (s.mono ? 'ui-monospace,Menlo,monospace' : 'system-ui,sans-serif');
  g += `<text x="${x0}" y="${y0 + 11}" font-family="${font}" font-size="12" font-weight="700" fill="${P.ink}">${esc((s.title || 'Aa').slice(0, 14))}</text>`;
  g += f(x1 - 26, y0 + 1, 26, 10, P.accent, {r: Math.min(r, 5)});
  const cy = y0 + 20, ch = y1 - cy;
  if (dens === 3) {
    const n = Math.max(3, Math.floor(ch / 11));
    for (let i = 0; i < n; i++) {
      const y = cy + i * 11;
      g += f(x0, y, x1 - x0, 9, i === 0 ? P.line : P.surface, {r: Math.min(r, 3), stroke: P.line});
      g += f(x0 + 4, y + 3, 18 + ((i * 7) % 14), 3, P.ink, {r: 1, op: .55}) + f(x0 + 70, y + 3, 24, 3, P.ink, {r: 1, op: .25});
      g += f(x1 - 24, y + 3, 14, 3, P.accent, {r: 1, op: i % 2 ? .5 : .9});
    }
  } else {
    const cols = dens === 2 ? 3 : 2, gap = dens === 2 ? 6 : 10, rows = dens === 2 ? 2 : 1;
    const cw = (x1 - x0 - gap * (cols - 1)) / cols, h = (ch - (rows - 1) * gap) / rows;
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
      const x = x0 + c * (cw + gap), y = cy + rr * (h + gap);
      if (surf === 'elevated') g += f(x, y + 2, cw, h, '#000', {r: r, op: .12}) + f(x, y, cw, h, P.surface, {r: r});
      else if (surf === 'open') g += f(x, y, cw, 2, P.ink, {op: .6});
      else g += f(x, y, cw, h, P.surface, {r: r, stroke: P.line});
      g += f(x + 6, y + 8, cw * .5, 3, P.ink, {r: 1, op: .7}) + f(x + 6, y + 15, cw * .75, 3, P.ink, {r: 1, op: .25});
      if (h > 34) g += f(x + 6, y + h - 14, cw * .3, 6, P.accent, {r: Math.min(r, 3)});
    }
  }
  return `<svg class="mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="Layout preview">${g}</svg>`;
}

/* Result hand-off: always selectable text + copy + download, because sandboxes may block either. */
function resultPanel(obj, o) {
  const txt = JSON.stringify(obj);
  return `<section class="result" aria-live="polite"><h3>${esc(o.title)}</h3><p class="hint">${esc(o.lead)}</p>` +
    `<textarea id="result-json" readonly rows="6" aria-label="Response to paste back to Claude">${esc(txt)}</textarea>` +
    `<div class="row"><button type="button" class="btn primary" data-a="copy">Copy</button>` +
    `<button type="button" class="btn" data-a="download" data-f="${esc(o.filename)}">Download .json</button></div>` +
    `<p class="hint" id="copy-hint" style="margin-top:8px"></p></section>`;
}
function hintMsg(m) { const e = $('#copy-hint'); if (e) e.textContent = m; }
async function copyResult() {
  const t = $('#result-json'); if (!t) return;
  try { await navigator.clipboard.writeText(t.value); hintMsg('Copied. Paste it back to Claude.'); }
  catch (e) { t.focus(); t.select(); try { document.execCommand('copy'); hintMsg('Copied. Paste it back to Claude.'); } catch (_) { hintMsg('Select the text above and copy it.'); } }
}
function downloadResult(name) {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([$('#result-json').value], {type: 'application/json'}));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    hintMsg('Downloaded. If nothing saved, copy the text instead.');
  } catch (e) { hintMsg('Download is blocked here. Copy the text instead.'); }
}
