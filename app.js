// === КОНФИГ ===
const ALLOWED_DOMAINS = ['restaff.pro', 'restaff.tech', 'staffco.ru'];

const DEPTS = [
  {id:'top',     name:'Топ менеджмент', base:'#000000', baseLight:'#2a2a2a', isLuxBlack: true},
  {id:'sales',   name:'Продажи',         base:'#DC2626', baseLight:'#F97316'},
  {id:'mkt',     name:'Маркетинг',       base:'#059669', baseLight:'#10B981'},
  {id:'fin',     name:'Финансы',         base:'#D97706', baseLight:'#FBBF24'},
  {id:'legal',   name:'Юристы',          base:'#0E7490', baseLight:'#22D3EE'},
  {id:'dev',     name:'Разработка',      base:'#1D4ED8', baseLight:'#3B82F6'},
  {id:'support', name:'Поддержка',       base:'#7C3AED', baseLight:'#A78BFA'},
  {id:'analyt',  name:'Аналитика',       base:'#0F766E', baseLight:'#5EEAD4'},
  {id:'hr',      name:'HR',              base:'#F43F5E', baseLight:'#FB7185'}
];

const TATTOO_TEXT = 'Успех\nнеизбежен';
const CIRC_SIZE = 0.38;
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
// ✱ Универсальный рендерер emoji: всегда сбрасываем fillStyle чтобы избежать "окраски" emoji
// в цвет предыдущего fillStyle (glow). На системах где emoji-шрифт не загружен,
// canvas использует fillStyle для рендера символа.
function drawEmoji(ctx, emoji, x, y, size) {
  ctx.save();
  ctx.font = size + 'px ' + EMOJI_FONT;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}


// === СТЕЙТ ===
let currentUser = null;
let dept = DEPTS[5];
let region = 'GL';
let img = null;
let zoom = 1.0, panX = 0, panY = 0;
let glowAmt = 0.4;
let showLogoShirt = true;
let logoShirtSize = 0.06, logoShirtX = 0, logoShirtY = 0;
let gradDir = 'tr';
let topNeonColor = '#7C3AED';

let showTattoo = false;
let tattooX = -0.25, tattooY = -0.2, tattooSz = 1.0, tattooRot = -10;
let pet = 'none';
let showPassport = false;
let modes = { villain:false, burnout:false, belarus:false, karaoke:false, redflag:false, vacation:false, cringe:false };

let violetLogo = null;
let logoReady = false;
let refImage = null;

// === ЛОГО RE ИЗ ASSETS ===
async function loadLogo() {
  try {
    const r = await fetch('assets-data.json');
    const data = await r.json();
    if (data.logo) {
      violetLogo = new Image();
      violetLogo.onload = () => { logoReady = true; render(); };
      violetLogo.src = data.logo;
    } else if (data.LOGO_VIOLET) {
      violetLogo = new Image();
      violetLogo.onload = () => { logoReady = true; render(); };
      violetLogo.src = 'data:image/png;base64,' + data.LOGO_VIOLET;
    }
    // ✱ Эталон-изображение
    if (data.ref) {
      const refImgEl = document.getElementById('refImage');
      if (refImgEl) refImgEl.src = data.ref;
    }
    return;
  } catch(e) {
    console.warn('Assets load failed', e);
  }
  logoReady = true;
}

// === АВТОРИЗАЦИЯ ===
function openSignIn() {
  document.getElementById('signin-modal').classList.add('active');
  document.getElementById('emailInput').focus();
}
function closeSignIn() {
  document.getElementById('signin-modal').classList.remove('active');
  document.getElementById('emailErr').textContent = '';
}
function trySignIn() {
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const err = document.getElementById('emailErr');
  if (!email.includes('@')) { err.textContent = 'Введите корректный email'; return; }
  const domain = email.split('@')[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    err.textContent = 'Доступ только для сотрудников ReStaff';
    return;
  }
  currentUser = email;
  localStorage.setItem('restaff_user', email);
  closeSignIn();
  showApp();
}
function signOut() {
  currentUser = null;
  localStorage.removeItem('restaff_user');
  document.getElementById('app').classList.remove('active');
  document.getElementById('landing').classList.add('active');
}
function showApp() {
  document.getElementById('landing').classList.remove('active');
  document.getElementById('app').classList.add('active');
  document.getElementById('userEmail').textContent = currentUser;
  initApp();
}

// === INIT APP ===
let appInitialized = false;
function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  const deptListEl = document.getElementById('deptList');
  DEPTS.forEach(d => {
    const el = document.createElement('div');
    el.className = 'dept-item' + (d.id === dept.id ? ' selected' : '');
    el.innerHTML = '<div class="dept-swatch" style="background:linear-gradient(135deg, ' + d.base + ', ' + d.baseLight + ')"></div>' + d.name;
    el.onclick = () => {
      document.querySelectorAll('.dept-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      dept = d;
      document.getElementById('topNeonRow').style.display = d.isLuxBlack ? 'flex' : 'none';
      render();
    };
    deptListEl.appendChild(el);
  });

  loadLogo().then(() => render());
  render();
}

// === КОНТРОЛЫ ===
function setZoom(v) { zoom = v/100; document.getElementById('zoomV').textContent = zoom.toFixed(2)+'×'; render(); }
function setPanY(v) { panY = v/100; document.getElementById('panYV').textContent = v; render(); }
function setPanX(v) { panX = v/100; document.getElementById('panXV').textContent = v; render(); }
function setGlow(v) { glowAmt = v/100; document.getElementById('glowV').textContent = v + '%'; render(); }
function setTopNeon(v) { topNeonColor = v; render(); }
function setRegion(el) {
  document.querySelectorAll('[data-region]').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); region = el.dataset.region; render();
}
function setLogoShirt(v) { showLogoShirt = v; render(); }
function setLogoShirtSize(v) { logoShirtSize = v/100; document.getElementById('logoShirtV').textContent = v + '%'; render(); }
function setLogoShirtX(v) { logoShirtX = v/100; document.getElementById('logoShirtXV').textContent = v; render(); }
function setLogoShirtY(v) { logoShirtY = v/100; document.getElementById('logoShirtYV').textContent = v; render(); }
function setDir(el) {
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); gradDir = el.dataset.dir; render();
}
function toggleCringe() {
  document.getElementById('cringeHeader').classList.toggle('open');
  document.getElementById('cringeBody').classList.toggle('open');
}
function setTattoo(v) { showTattoo = v; render(); }
function setTattooX(v) { tattooX = v/100; document.getElementById('tattooXV').textContent = v; render(); }
function setTattooY(v) { tattooY = v/100; document.getElementById('tattooYV').textContent = v; render(); }
function setTattooSz(v) { tattooSz = v/100; document.getElementById('tattooSzV').textContent = v + '%'; render(); }
function setTattooRot(v) { tattooRot = parseInt(v); document.getElementById('tattooRotV').textContent = v + '°'; render(); }
function setPet(el) {
  document.querySelectorAll('[data-pet]').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); pet = el.dataset.pet; render();
}
function setPassport(v) { showPassport = v; render(); }
function setMode(name, v) {
  modes[name] = v;
  const chip = document.getElementById('chip-' + name);
  if (chip) chip.classList.toggle('active', v);
  if (name === 'villain' && v) { modes.burnout = false; document.getElementById('chip-burnout').classList.remove('active'); document.getElementById('burnoutCheck').checked = false; }
  if (name === 'burnout' && v) { modes.villain = false; document.getElementById('chip-villain').classList.remove('active'); document.getElementById('villainCheck').checked = false; }
  render();
}

// === ЗАГРУЗКА ФОТО ===
function loadPhoto(e) {
  const file = e.target.files[0]; if (!file) return;
  const i = new Image();
  i.onload = () => {
    img = i;
    document.getElementById('upLabel').textContent = file.name.slice(0, 28);
    document.getElementById('up').classList.add('has-photo');
    document.getElementById('dlBtn').disabled = false;
    // Сбрасываем состояние кнопки удаления фона
    const bgBtn = document.getElementById('bgRemoveBtn');
    bgBtn.disabled = false;
    bgBtn.classList.remove('processing', 'done');
    document.getElementById('bgRemoveText').textContent = 'Убрать фон автоматически';
    document.getElementById('bgRemoveStatus').className = 'bg-remove-status';
    document.getElementById('bgRemoveStatus').textContent = '';
    render();
  };
  i.src = URL.createObjectURL(file);
}

// === УДАЛЕНИЕ ФОНА ЧЕРЕЗ /api/remove-bg ===
async function removeBgFromPhoto() {
  if (!img) return;
  const btn = document.getElementById('bgRemoveBtn');
  const textEl = document.getElementById('bgRemoveText');
  const statusEl = document.getElementById('bgRemoveStatus');
  const fileInput = document.getElementById('photoInput');
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  btn.disabled = true;
  btn.classList.add('processing');
  btn.classList.remove('done');
  textEl.textContent = 'Обрабатываем фото...';
  statusEl.className = 'bg-remove-status';
  statusEl.textContent = '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Image-Type': file.type || 'image/jpeg',
      },
      body: arrayBuffer,
    });
    if (!response.ok) {
      let msg = 'HTTP ' + response.status;
      try { const err = await response.json(); if (err.error) msg = err.error; } catch(e) {}
      throw new Error(msg);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const newImg = new Image();
    newImg.onload = () => {
      img = newImg;
      btn.classList.remove('processing');
      btn.classList.add('done');
      textEl.textContent = 'Фон удалён ✓';
      statusEl.className = 'bg-remove-status ok';
      statusEl.textContent = '✓ Фон убран';
      btn.disabled = false;
      render();
    };
    newImg.src = url;
  } catch (e) {
    console.error(e);
    btn.classList.remove('processing');
    textEl.textContent = 'Убрать фон автоматически';
    statusEl.className = 'bg-remove-status fail';
    statusEl.textContent = '⚠️ ' + (e.message || e);
    btn.disabled = false;
  }
}

// === HELPERS ===
function hexToRgba(hex, a) {
  const num = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((num >> 16) & 0xff) + ', ' + ((num >> 8) & 0xff) + ', ' + (num & 0xff) + ', ' + a + ')';
}

function getGradStartEnd(cx, cy, radius, dir) {
  switch (dir) {
    case 'tl': return [cx - radius, cy - radius, cx + radius, cy + radius];
    case 'tr': return [cx + radius, cy - radius, cx - radius, cy + radius];
    case 'bl': return [cx - radius, cy + radius, cx + radius, cy - radius];
    case 'br': return [cx + radius, cy + radius, cx - radius, cy - radius];
    default: return [cx - radius, cy - radius, cx + radius, cy + radius];
  }
}

function drawPetPeeking(targetCtx, S, cx, cy, radius, kind) {
  const px = cx + radius * 1.1, py = cy - radius * 0.3;
  const sz = S * 0.32;
  targetCtx.save();
  targetCtx.fillStyle = '#000000';
  targetCtx.translate(px, py);
  targetCtx.rotate(-25 * Math.PI / 180);
  targetCtx.font = sz + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(kind === 'cat' ? '🐱' : '🐶', 0, 0);
  targetCtx.restore();
}

function drawPassport(targetCtx, S, cx, cy, radius) {
  const px = cx + radius * 1.05, py = cy - radius * 0.1;
  const sz = S * 0.36;
  targetCtx.save();
  targetCtx.fillStyle = '#000000';
  targetCtx.translate(px, py);
  targetCtx.rotate(8 * Math.PI / 180);
  targetCtx.font = sz + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText('📖', 0, 0);
  targetCtx.font = (sz * 0.35) + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  targetCtx.fillText('🪪', -sz * 0.05, -sz * 0.05);
  targetCtx.restore();
}

function drawTattoo(targetCtx, S, cx, cy, radius) {
  if (!showTattoo) return;
  const tx = cx + tattooX * radius, ty = cy + tattooY * radius;
  const dx = tx - cx, dy = ty - cy;
  if (dx*dx + dy*dy > radius * radius * 1.05) return;

  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  targetCtx.clip();
  targetCtx.translate(tx, ty);
  targetCtx.rotate(tattooRot * Math.PI / 180);
  const baseFontSize = S * 0.034 * tattooSz;
  targetCtx.font = '600 ' + baseFontSize + 'px "Caveat", cursive';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillStyle = modes.villain ? 'rgba(180, 20, 20, 0.85)' : 'rgba(35, 25, 25, 0.78)';
  const lines = TATTOO_TEXT.split('\n');
  const lineH = baseFontSize * 1.05;
  const startY = -((lines.length - 1) * lineH) / 2;
  lines.forEach((line, idx) => { targetCtx.fillText(line, 0, startY + idx * lineH); });
  targetCtx.restore();
}

function drawLightning(targetCtx, x1, y1, x2, y2, segments, color) {
  targetCtx.save();
  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 3;
  targetCtx.lineCap = 'round';
  targetCtx.lineJoin = 'round';
  targetCtx.shadowBlur = 12;
  targetCtx.shadowColor = color;
  targetCtx.beginPath();
  targetCtx.moveTo(x1, y1);
  const dx = (x2 - x1) / segments, dy = (y2 - y1) / segments;
  for (let i = 1; i < segments; i++) {
    const jx = (Math.sin(i * 13.7) * 0.5) * Math.abs(dx) * 0.7;
    const jy = (Math.cos(i * 9.3) * 0.5) * Math.abs(dy) * 0.4;
    targetCtx.lineTo(x1 + dx * i + jx, y1 + dy * i + jy);
  }
  targetCtx.lineTo(x2, y2);
  targetCtx.stroke();
  targetCtx.restore();
}

function drawPotatoMountain(targetCtx, S, cx, cy, radius) {
  targetCtx.save();
  targetCtx.fillStyle = '#000000';
  targetCtx.beginPath();
  targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  targetCtx.clip();
  targetCtx.beginPath();
  targetCtx.rect(0, cy + radius * 0.1, S, S);
  targetCtx.clip();
  const potatoes = [];
  for (let row = 0; row < 5; row++) {
    const yBase = 0.35 + row * 0.15;
    const count = 8 - row;
    for (let i = 0; i < count; i++) {
      potatoes.push({
        x: -0.85 + (1.7 / (count - 1 || 1)) * i + (Math.sin(row * 7 + i * 3) * 0.05),
        y: yBase + (Math.cos(i * 5 + row) * 0.04),
        sz: 0.11 + (Math.sin(i * 11 + row * 2) * 0.025)
      });
    }
  }
  potatoes.forEach(p => {
    targetCtx.font = (S * p.sz) + 'px ' + EMOJI_FONT;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText('🥔', cx + p.x * radius, cy + p.y * radius);
  });
  targetCtx.restore();
}

function drawWineAndMic(targetCtx, S, cx, cy, radius) {
  targetCtx.save();
  targetCtx.fillStyle = '#000000';
  targetCtx.beginPath();
  targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  targetCtx.clip();
  targetCtx.beginPath();
  targetCtx.rect(0, cy + radius * 0.1, S, S);
  targetCtx.clip();
  targetCtx.font = (S * 0.22) + 'px ' + EMOJI_FONT;
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText('🎤', cx, cy + radius * 0.65);
  const wines = [
    {x: -0.7, y: 0.5, sz: 0.16}, {x: -0.45, y: 0.7, sz: 0.17},
    {x: -0.2, y: 0.85, sz: 0.16}, {x: 0.25, y: 0.85, sz: 0.17},
    {x: 0.5, y: 0.7, sz: 0.17}, {x: 0.75, y: 0.55, sz: 0.15},
    {x: -0.6, y: 0.9, sz: 0.15}, {x: 0.55, y: 0.95, sz: 0.16}
  ];
  wines.forEach(w => {
    targetCtx.font = (S * w.sz) + 'px ' + EMOJI_FONT;
    targetCtx.fillText('🍷', cx + w.x * radius, cy + w.y * radius);
  });
  targetCtx.restore();
}

function drawBurnoutAttrs(targetCtx, S, cx, cy, radius) {
  targetCtx.save();
  targetCtx.fillStyle = '#000000';
  // 3 пилюли справа
  const pillBaseX = cx + radius * 1.18, pillBaseY = cy - radius * 0.25;
  const pillSz = S * 0.085;
  targetCtx.font = pillSz + 'px ' + EMOJI_FONT;
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    targetCtx.fillText('💊', pillBaseX + i * pillSz * 0.85 - pillSz, pillBaseY);
  }
  // Кофе и молоко внизу снаружи
  targetCtx.font = (S * 0.1) + 'px ' + EMOJI_FONT;
  targetCtx.fillText('☕', cx - radius * 0.7, cy + radius * 1.18);
  targetCtx.fillText('🥛', cx - radius * 0.35, cy + radius * 1.22);
  targetCtx.fillText('☕', cx + radius * 0.35, cy + radius * 1.22);
  targetCtx.fillText('🥛', cx + radius * 0.7, cy + radius * 1.18);
  // Черепа на футболке
  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  targetCtx.clip();
  targetCtx.beginPath();
  targetCtx.rect(0, cy + radius * 0.3, S, S);
  targetCtx.clip();
  targetCtx.font = (S * 0.075) + 'px ' + EMOJI_FONT;
  targetCtx.globalAlpha = 0.85;
  targetCtx.fillText('💀', cx - radius * 0.35, cy + radius * 0.55);
  targetCtx.fillText('💀', cx + radius * 0.35, cy + radius * 0.55);
  targetCtx.fillText('💀', cx, cy + radius * 0.78);
  targetCtx.restore();
  targetCtx.restore();
}

// === ГЛАВНАЯ ФУНКЦИЯ РЕНДЕРА ===
function renderAvatar(targetCtx, S, withBg) {
  targetCtx.clearRect(0, 0, S, S);
  if (withBg) {
    targetCtx.fillStyle = (region === 'RU') ? '#ffffff' : '#0a0a0f';
    targetCtx.fillRect(0, 0, S, S);
  }

  if (modes.cringe && withBg) {
    const stars = ['⭐','✨','🌟','💫','🎊','🎉','🌈','💖','🎁','🌹','💐'];
    targetCtx.save();
    for (let i = 0; i < 40; i++) {
      const seed = i * 37;
      const x = (seed * 13) % S, y = (seed * 17) % S;
      const sz = 18 + (seed % 32);
      targetCtx.font = sz + 'px ' + EMOJI_FONT;
      targetCtx.globalAlpha = 0.55;
      targetCtx.fillText(stars[i % stars.length], x, y);
    }
    targetCtx.restore();
  }

  const cx = S / 2, cy = S / 2;
  const radius = S * CIRC_SIZE;
  const onDarkBg = withBg && region === 'GL';

  if (glowAmt > 0) {
    let glowColor = dept.baseLight, glowStrength = glowAmt;
    if (modes.villain) { glowColor = '#DC2626'; glowStrength = Math.max(glowAmt, 0.85); }
    else if (modes.burnout) { glowColor = '#9CA3AF'; glowStrength = Math.max(glowAmt * 0.4, 0.15); }
    else if (dept.isLuxBlack) { glowColor = topNeonColor; glowStrength = Math.pow(glowAmt, 1.8) * 0.85 + 0.1; }
    // ✱ FIX: ограничиваем размер glow и его альфу, чтобы не "окрашивать" emoji вокруг
    const glowRadius = radius * (1 + Math.min(glowStrength, 0.5) * 0.4);
    targetCtx.save();
    const glow = targetCtx.createRadialGradient(cx, cy, radius * 0.98, cx, cy, glowRadius);
    glow.addColorStop(0, hexToRgba(glowColor, Math.min(glowStrength * 0.55, 0.55)));
    glow.addColorStop(1, hexToRgba(glowColor, 0));
    targetCtx.fillStyle = glow;
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
    // ✱ КРИТИЧНО: сбрасываем fillStyle на сплошной цвет, чтобы последующие emoji не отрисовались градиентом
    targetCtx.fillStyle = '#000000';
  }

  if (modes.villain) {
    targetCtx.save();
    const lightnings = [
      {a: -Math.PI/3, len: 1.6}, {a: -Math.PI*2/3, len: 1.4},
      {a: -Math.PI*0.95, len: 1.5}, {a: Math.PI/3, len: 1.5},
      {a: Math.PI*2/3, len: 1.6}, {a: Math.PI*0.95, len: 1.4}
    ];
    lightnings.forEach(l => {
      const x1 = cx + Math.cos(l.a) * radius * 0.95, y1 = cy + Math.sin(l.a) * radius * 0.95;
      const x2 = cx + Math.cos(l.a) * radius * l.len, y2 = cy + Math.sin(l.a) * radius * l.len;
      drawLightning(targetCtx, x1, y1, x2, y2, 6, '#ff3030');
    });
    targetCtx.restore();
  }

  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  targetCtx.clip();

  let grad;
  if (modes.villain) {
    grad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, '#991B1B'); grad.addColorStop(0.5, '#1a0606'); grad.addColorStop(1, '#000000');
  } else if (modes.burnout) {
    grad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, '#9CA3AF'); grad.addColorStop(0.5, '#6B7280'); grad.addColorStop(1, '#4B5563');
  } else if (gradDir === 'center') {
    grad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    if (dept.isLuxBlack) {
      grad.addColorStop(0, '#2a2a2a'); grad.addColorStop(0.55, '#0f0f0f'); grad.addColorStop(1, '#000000');
    } else {
      grad.addColorStop(0, dept.baseLight); grad.addColorStop(1, dept.base);
    }
  } else {
    const ends = getGradStartEnd(cx, cy, radius, gradDir);
    grad = targetCtx.createLinearGradient(ends[0], ends[1], ends[2], ends[3]);
    if (dept.isLuxBlack) {
      grad.addColorStop(0, '#1f1f1f'); grad.addColorStop(0.55, '#0a0a0a'); grad.addColorStop(1, '#000000');
    } else {
      grad.addColorStop(0, dept.baseLight); grad.addColorStop(1, dept.base);
    }
  }
  targetCtx.fillStyle = grad;
  targetCtx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  if (dept.isLuxBlack && !modes.villain && !modes.burnout) {
    const sheen = targetCtx.createRadialGradient(cx - radius * 0.4, cy - radius * 0.5, 0, cx - radius * 0.4, cy - radius * 0.5, radius * 0.8);
    sheen.addColorStop(0, 'rgba(212, 175, 55, 0.09)');
    sheen.addColorStop(1, 'rgba(212, 175, 55, 0)');
    targetCtx.fillStyle = sheen;
    targetCtx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
  targetCtx.restore();

  if (onDarkBg) {
    targetCtx.strokeStyle = 'rgba(255,255,255,0.12)';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.stroke();
  }

  // === ОТПУСК ===
  if (modes.vacation) {
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.clip();
    targetCtx.translate(cx, cy);
    targetCtx.rotate(-7 * Math.PI / 180);
    const fontSize = radius * 0.55;
    targetCtx.font = '400 ' + fontSize + 'px "Permanent Marker", cursive';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillStyle = 'rgba(0,0,0,0.25)';
    targetCtx.fillText('Отпуск', 4, 4);
    targetCtx.fillStyle = '#ffffff';
    targetCtx.fillText('Отпуск', 0, 0);
    targetCtx.restore();
  } else if (img) {
    const photoH = img.height;
    const headTargetH = radius * 1.5;
    const headInPhotoH = photoH * 0.28;
    let scale = headTargetH / headInPhotoH * zoom;
    const drawW = img.width * scale, drawH = photoH * scale;
    const headCenterInPhoto = drawH * 0.14;
    const drawX = cx - drawW / 2 + panX * radius;
    const drawY = cy - headCenterInPhoto + panY * radius;

    // Слой 1: верх
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.rect(0, 0, S, cy);
    targetCtx.clip();
    targetCtx.drawImage(img, drawX, drawY, drawW, drawH);

    if (modes.villain) {
      targetCtx.globalCompositeOperation = 'overlay';
      targetCtx.fillStyle = 'rgba(220, 38, 38, 0.55)';
      targetCtx.fillRect(0, 0, S, cy);
      targetCtx.globalCompositeOperation = 'source-over';
      const dark = targetCtx.createRadialGradient(cx, cy - radius*0.3, radius*0.5, cx, cy - radius*0.3, radius);
      dark.addColorStop(0, 'rgba(0,0,0,0)');
      dark.addColorStop(1, 'rgba(0,0,0,0.55)');
      targetCtx.fillStyle = dark;
      targetCtx.fillRect(0, 0, S, cy);
    }
    if (modes.burnout) {
      targetCtx.globalCompositeOperation = 'saturation';
      targetCtx.fillStyle = '#888888';
      targetCtx.fillRect(0, 0, S, cy);
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.fillStyle = 'rgba(120, 130, 110, 0.25)';
      targetCtx.fillRect(0, 0, S, cy);
      const eyeBagY = cy - radius * 0.25 + panY * radius;
      targetCtx.fillStyle = 'rgba(60, 50, 55, 0.35)';
      targetCtx.beginPath();
      targetCtx.ellipse(cx - radius * 0.18 + panX * radius, eyeBagY, radius * 0.13, radius * 0.05, 0, 0, Math.PI*2);
      targetCtx.ellipse(cx + radius * 0.18 + panX * radius, eyeBagY, radius * 0.13, radius * 0.05, 0, 0, Math.PI*2);
      targetCtx.fill();
    }
    targetCtx.restore();

    // Слой 2: низ
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.clip();
    targetCtx.beginPath();
    targetCtx.rect(0, cy, S, S - cy);
    targetCtx.clip();
    targetCtx.drawImage(img, drawX, drawY, drawW, drawH);
    if (modes.villain) {
      targetCtx.globalCompositeOperation = 'overlay';
      targetCtx.fillStyle = 'rgba(220, 38, 38, 0.45)';
      targetCtx.fillRect(0, cy, S, S - cy);
      targetCtx.globalCompositeOperation = 'source-over';
    }
    if (modes.burnout) {
      targetCtx.globalCompositeOperation = 'saturation';
      targetCtx.fillStyle = '#888888';
      targetCtx.fillRect(0, cy, S, S - cy);
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.fillStyle = 'rgba(120, 130, 110, 0.25)';
      targetCtx.fillRect(0, cy, S, S - cy);
    }
    targetCtx.restore();

    // ✱ ТАТУ ПОВЕРХ ОБОИХ СЛОЁВ ФОТО — иначе была не видна
    drawTattoo(targetCtx, S, cx, cy, radius);

    // Лого на футболке
    if (showLogoShirt && logoReady && violetLogo) {
      const shirtLogoSize = S * logoShirtSize;
      const shirtLogoX = cx + logoShirtX * radius * 2;
      const shirtLogoY = cy + radius * 0.7 + logoShirtY * radius;
      targetCtx.save();
      if (shirtLogoY < cy) {
        targetCtx.beginPath();
        targetCtx.rect(0, 0, S, cy);
        targetCtx.clip();
      } else {
        targetCtx.beginPath();
        targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        targetCtx.clip();
      }
      targetCtx.drawImage(violetLogo, shirtLogoX - shirtLogoSize/2, shirtLogoY - shirtLogoSize/2, shirtLogoSize, shirtLogoSize);
      targetCtx.restore();
    }
  } else {
    // Placeholder силуэт
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.clip();
    targetCtx.fillStyle = 'rgba(255,255,255,0.35)';
    targetCtx.beginPath();
    targetCtx.arc(cx, cy - radius * 0.1, radius * 0.45, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.fillStyle = 'rgba(255,255,255,0.28)';
    targetCtx.beginPath();
    targetCtx.ellipse(cx, cy + radius * 0.95, radius * 0.85, radius * 0.55, 0, Math.PI, 0);
    targetCtx.fill();
    targetCtx.restore();
  }

  if (modes.burnout && !modes.vacation) drawBurnoutAttrs(targetCtx, S, cx, cy, radius);
  if (pet !== 'none' && !modes.vacation) drawPetPeeking(targetCtx, S, cx, cy, radius, pet);
  if (showPassport && !modes.vacation) drawPassport(targetCtx, S, cx, cy, radius);

  if (modes.belarus && !modes.vacation) {
    drawPotatoMountain(targetCtx, S, cx, cy, radius);
    targetCtx.save();
    targetCtx.font = (S * 0.16) + 'px ' + EMOJI_FONT;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillStyle = '#000000';
    targetCtx.fillText('🇧🇾', cx + radius * 1.05, cy - radius * 0.95);
    targetCtx.restore();
  }
  if (modes.karaoke && !modes.vacation) {
    drawWineAndMic(targetCtx, S, cx, cy, radius);
    targetCtx.save();
    targetCtx.font = (S * 0.16) + 'px ' + EMOJI_FONT;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillStyle = '#000000';
    targetCtx.fillText('🇬🇪', cx - radius * 1.05, cy - radius * 0.95);
    targetCtx.restore();
  }
  if (modes.redflag && !modes.vacation) {
    targetCtx.save();
    targetCtx.font = (S * 0.16) + 'px ' + EMOJI_FONT;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillStyle = '#000000';
    targetCtx.fillText('🚩', cx + radius * 1.05, cy - radius * 0.95);
    targetCtx.restore();
  }

  if (modes.cringe) {
    targetCtx.save();
    const vig = targetCtx.createRadialGradient(cx, cy, radius * 1.2, cx, cy, S * 0.75);
    vig.addColorStop(0, 'rgba(244, 114, 182, 0)');
    vig.addColorStop(1, 'rgba(244, 114, 182, 0.4)');
    targetCtx.fillStyle = vig;
    targetCtx.fillRect(0, 0, S, S);

    targetCtx.font = '700 ' + Math.round(S * 0.052) + 'px "Lobster", "Caveat", serif';
    targetCtx.textAlign = 'center';
    targetCtx.strokeStyle = '#fde047';
    targetCtx.lineWidth = 8;
    targetCtx.strokeText('✨ С ДНЁМ РОЖДЕНЬЯ ✨', cx, S * 0.07);
    targetCtx.strokeStyle = '#3b82f6';
    targetCtx.lineWidth = 4;
    targetCtx.strokeText('✨ С ДНЁМ РОЖДЕНЬЯ ✨', cx, S * 0.07);
    targetCtx.fillStyle = '#dc2626';
    targetCtx.fillText('✨ С ДНЁМ РОЖДЕНЬЯ ✨', cx, S * 0.07);

    targetCtx.font = '700 ' + Math.round(S * 0.032) + 'px "Monoton", serif';
    targetCtx.fillStyle = '#7e22ce';
    targetCtx.strokeStyle = '#fff';
    targetCtx.lineWidth = 3;
    targetCtx.strokeText('★ ДОРОГОМУ КОЛЛЕГЕ ★', cx, S * 0.14);
    targetCtx.fillText('★ ДОРОГОМУ КОЛЛЕГЕ ★', cx, S * 0.14);

    targetCtx.save();
    targetCtx.translate(S * 0.08, S * 0.35);
    targetCtx.rotate(-12 * Math.PI / 180);
    targetCtx.font = '500 ' + Math.round(S * 0.024) + 'px "Caveat", cursive';
    targetCtx.fillStyle = '#be185d';
    targetCtx.textAlign = 'left';
    targetCtx.fillText('Желаю счастья', 0, 0);
    targetCtx.fillText('и здоровья крепкого!', 0, S * 0.03);
    targetCtx.fillText('А ещё карьеры', 0, S * 0.06);
    targetCtx.fillText('вверх как у Илона! 🚀', 0, S * 0.09);
    targetCtx.restore();

    targetCtx.font = (S * 0.09) + 'px ' + EMOJI_FONT;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText('🌹', S * 0.08, S * 0.92);
    targetCtx.fillText('💐', S * 0.92, S * 0.92);
    targetCtx.fillText('🌷', S * 0.92, S * 0.5);
    targetCtx.fillText('🌸', S * 0.08, S * 0.5);
    targetCtx.fillText('💖', S * 0.5, S * 0.88);

    targetCtx.font = '700 ' + Math.round(S * 0.03) + 'px "Bungee Shade", "Lobster", serif';
    targetCtx.fillStyle = '#16a34a';
    targetCtx.strokeStyle = '#fde047';
    targetCtx.lineWidth = 4;
    targetCtx.strokeText('🎂 ОТ ВСЕЙ КОМАНДЫ 🎂', cx, S * 0.97);
    targetCtx.fillText('🎂 ОТ ВСЕЙ КОМАНДЫ 🎂', cx, S * 0.97);
    targetCtx.restore();
  }
}


function render() {
  const cv = document.getElementById('cv');
  if (!cv) return;
  renderAvatar(cv.getContext('2d'), cv.width, true);
  ['pv-tg', 'pv-mm', 'pv-zoom', 'pv-gmail'].forEach(id => {
    const m = document.getElementById(id);
    if (m) renderAvatar(m.getContext('2d'), m.width, true);
  });
  // эталон теперь img, рендер не нужен
}

function download() {
  if (!img && !modes.vacation) return;
  const cv = document.getElementById('cv');
  const tmp = document.createElement('canvas');
  tmp.width = cv.width; tmp.height = cv.height;
  renderAvatar(tmp.getContext('2d'), tmp.width, false);
  const a = document.createElement('a');
  a.download = 'restaff-' + dept.id + '-' + region + '.png';
  a.href = tmp.toDataURL('image/png');
  a.click();
}

// === INIT ===
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('restaff_user');
  if (savedUser) {
    const domain = savedUser.split('@')[1];
    if (ALLOWED_DOMAINS.includes(domain)) {
      currentUser = savedUser;
      showApp();
    }
  }
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => render());
}
