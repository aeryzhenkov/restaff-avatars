// === Корпоративные домены для проверки в демо ===
const ALLOWED_DOMAINS = ['restaff.pro', 'restaff.tech', 'staffco.ru'];

// === Бренд ===
const BRAND_RU = '#2563EB';
const BRAND_GL = '#7C3AED';

const DEPTS = [
  {id:'top',     name:'Топ менеджмент',           name_en:'Leadership',         neon:['#0F172A','#475569']},
  {id:'sales',   name:'Продажи',                   name_en:'Sales',              neon:['#22C55E','#84CC16']},
  {id:'mkt',     name:'Маркетинг',                 name_en:'Marketing',          neon:['#EC4899','#A855F7']},
  {id:'fin',     name:'Финансы и бухгалтерия',     name_en:'Finance',            neon:['#FACC15','#F59E0B']},
  {id:'legal',   name:'Юристы и комплаенс',        name_en:'Legal & Compliance', neon:['#06B6D4','#0EA5E9']},
  {id:'dev',     name:'Продукт и Разработка',      name_en:'Product & Engineering', neon:['#3B82F6','#6366F1']},
  {id:'support', name:'Аккаунтинг SE и поддержка', name_en:'Account SE & Support', neon:['#10B981','#14B8A6']},
  {id:'analyt',  name:'Аналитика',                 name_en:'Analytics',          neon:['#D946EF','#A855F7']},
  {id:'hr',      name:'HR',                        name_en:'HR',                 neon:['#FB923C','#F43F5E']}
];

// === i18n ===
const I18N = {
  ru: {
    eyebrow: 'Internal · Команда ReStaff',
    h1a: 'Единый стиль',
    h1b: 'для всей команды',
    sub: 'Корпоративный сервис создания аватарок для Zoom, Slack и почты. Загрузите фото — мы обработаем его в едином стиле бренда.',
    f1: 'Авто-кроп по половине лица',
    f2: 'Цвет отдела и региона',
    f3: '9 фильтров для самовыражения',
    signin: 'Войти через корпоративный Google',
    access: 'Доступ только для сотрудников ReStaff',
    foot: '© ReStaff 2026',
    modal_title: 'Демо-вход',
    modal_h: 'Введите рабочий email',
    modal_sub: 'В демо-версии используется проверка домена. На проде это будет полноценный Google OAuth.',
    modal_btn: 'Войти',
    modal_cancel: 'Отмена',
    samples_label: 'Эталон\nстиля →',
    sample_m: 'пример M',
    sample_f: 'пример Ж',
    samples_hint: 'Лицо смещено в правую часть круга — видна левая половина. Сдвинь фото мышью если автокроп не попал.',
    step1: '1 · Фото',
    step2: '2 · Подстройка',
    step3: '3 · Подразделение',
    step4: '4 · Регион',
    step5: '5 · Фильтр',
    reset: 'сбросить',
    upload: 'Загрузить фото',
    status_init: 'Загрузите фото — лицо встанет на правую сторону',
    status_searching: 'Ищем лицо...',
    status_found: 'Лицо найдено · кадр настроен',
    status_not_found: 'Лицо не определилось — подстройте мышью',
    drag_tip: 'Сдвинуть мышью',
    drag_hint: 'Перетащи фото в превью',
    download: 'Скачать PNG',
    err_invalid_email: 'Введите корректный email',
    err_wrong_domain: 'Доступ только для сотрудников ReStaff'
  },
  en: {
    eyebrow: 'Internal · ReStaff team',
    h1a: 'One brand style',
    h1b: 'for the whole team',
    sub: 'Corporate avatar service for Zoom, Slack and email. Upload your photo — we shape it into the unified brand style.',
    f1: 'Auto half-face crop',
    f2: 'Department & region color',
    f3: '9 filters for self-expression',
    signin: 'Sign in with corporate Google',
    access: 'For ReStaff team members only',
    foot: '© ReStaff 2026',
    modal_title: 'Demo login',
    modal_h: 'Enter your work email',
    modal_sub: 'Demo version uses domain check. Production will have full Google OAuth.',
    modal_btn: 'Sign in',
    modal_cancel: 'Cancel',
    samples_label: 'Style\nreference →',
    sample_m: 'sample M',
    sample_f: 'sample F',
    samples_hint: 'Face is shifted to the right side of the circle — left half visible. Drag to adjust if auto-crop missed.',
    step1: '1 · Photo',
    step2: '2 · Fine-tune',
    step3: '3 · Department',
    step4: '4 · Region',
    step5: '5 · Filter',
    reset: 'reset',
    upload: 'Upload photo',
    status_init: 'Upload your photo — face will land on the right',
    status_searching: 'Detecting face...',
    status_found: 'Face found · crop set',
    status_not_found: 'Face not detected — adjust with mouse',
    drag_tip: 'Drag to adjust',
    drag_hint: 'Drag photo in preview',
    download: 'Download PNG',
    err_invalid_email: 'Enter a valid email',
    err_wrong_domain: 'For ReStaff team members only'
  }
};

let currentLang = localStorage.getItem('restaff_lang') || 'ru';

function applyLang(lang) {
  const t = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (t[key]) node.innerHTML = t[key].replace(/\n/g, '<br>');
  });
  document.documentElement.lang = lang;
}

function setLang(el) {
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentLang = el.dataset.lang;
  localStorage.setItem('restaff_lang', currentLang);
  applyLang(currentLang);
  if (deptList) renderDeptList();
}

// === State ===
let dept = DEPTS[0];
let region = 'RU';
let photoImg = null;
let processedCache = null, cacheKey = '';
let exportSize = 512;
let fx = 'bw';
let userZoom = 1.0;
let panX = 0, panY = 0;
let faceBox = null;
let currentUser = null;

// === Assets ===
const violetLogo = new Image();
const blueLogo = new Image();
const sampleMale = new Image();
const sampleFemale = new Image();
let assetsReady = 0;

function onAssetReady() {
  assetsReady++;
  if (assetsReady === 4) {
    if (document.getElementById('app').classList.contains('active')) {
      render();
      renderSamples();
    }
  }
}

// Загружаем ассеты с CDN-friendly путей
fetch('assets-data.json')
  .then(r => r.json())
  .then(data => {
    violetLogo.onload = onAssetReady;
    blueLogo.onload = onAssetReady;
    sampleMale.onload = onAssetReady;
    sampleFemale.onload = onAssetReady;
    violetLogo.src = 'data:image/png;base64,' + data.LOGO_VIOLET;
    blueLogo.src = 'data:image/png;base64,' + data.LOGO_BLUE;
    sampleMale.src = 'data:image/jpeg;base64,' + data.SAMPLE_MALE;
    sampleFemale.src = 'data:image/jpeg;base64,' + data.SAMPLE_FEMALE;
    const logoSrc = 'data:image/png;base64,' + data.LOGO_VIOLET;
    document.getElementById('navLogo').src = logoSrc;
    document.getElementById('appLogo').src = logoSrc;
    const orbLogo = document.getElementById('orbLogo');
    if (orbLogo) orbLogo.src = logoSrc;
  });

// === Auth ===
function openSignIn() {
  document.getElementById('signin-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('emailInput').focus(), 100);
}
function closeSignIn() {
  document.getElementById('signin-modal').style.display = 'none';
  document.getElementById('emailErr').textContent = '';
  document.getElementById('emailInput').value = '';
}
function trySignIn() {
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const errEl = document.getElementById('emailErr');
  const t = I18N[currentLang];
  if (!email || !email.includes('@') || !email.includes('.')) {
    errEl.textContent = t.err_invalid_email;
    return;
  }
  const domain = email.split('@')[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    errEl.textContent = t.err_wrong_domain;
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
  document.getElementById('landing').classList.remove('hidden');
}
function showApp() {
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('app').classList.add('active');
  document.getElementById('userEmail').textContent = currentUser;
  if (assetsReady === 4) {
    render();
    renderSamples();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('signin-modal').style.display === 'flex') {
    trySignIn();
  }
  if (e.key === 'Escape' && document.getElementById('signin-modal').style.display === 'flex') {
    closeSignIn();
  }
});

// === Dept list ===
let deptList;
function renderDeptList() {
  deptList = document.getElementById('deptList');
  if (!deptList) return;
  deptList.innerHTML = '';
  DEPTS.forEach(d => {
    const item = document.createElement('div');
    item.className = 'dept-item' + (d.id === dept.id ? ' selected' : '');
    const sw = `linear-gradient(135deg, ${d.neon[0]}, ${d.neon[1]})`;
    const name = currentLang === 'en' ? d.name_en : d.name;
    item.innerHTML = `<div class="dept-swatch" style="background:${sw}"></div>${name}`;
    item.onclick = () => {
      document.querySelectorAll('.dept-item').forEach(x => x.classList.remove('selected'));
      item.classList.add('selected');
      dept = d;
      processedCache = null;
      render();
    };
    deptList.appendChild(item);
  });
}

// === Controls ===
function setRegion(el) {
  region = el.dataset.region;
  document.querySelectorAll('.region-btn').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  render();
}
function setSize(s, el) {
  exportSize = s;
  document.querySelectorAll('.size-pill button').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
}
function setFx(el) {
  fx = el.dataset.fx;
  document.querySelectorAll('.fx-btn').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  processedCache = null;
  render();
}
function setZoom(v) {
  userZoom = v/100;
  document.getElementById('zoomVal').textContent = userZoom.toFixed(2) + '×';
  processedCache = null;
  render();
}
function resetTweak() {
  userZoom = 1.0;
  panX = 0; panY = 0;
  document.getElementById('zoomRange').value = 100;
  document.getElementById('zoomVal').textContent = '1.00×';
  processedCache = null;
  render();
}

// === Photo loading ===
async function detectFace(img) {
  if ('FaceDetector' in window) {
    try {
      const detector = new window.FaceDetector({fastMode: true, maxDetectedFaces: 1});
      const faces = await detector.detect(img);
      if (faces && faces.length > 0) {
        const f = faces[0].boundingBox;
        return {x: f.x, y: f.y, w: f.width, h: f.height, detected: true};
      }
    } catch(e) {}
  }
  const w = img.width, h = img.height;
  const fw = Math.min(w, h) * 0.35;
  const fh = fw * 1.15;
  return {x: w/2 - fw/2, y: h*0.32 - fh/2, w: fw, h: fh, detected: false};
}

function loadPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const t = I18N[currentLang];
  document.getElementById('cropStatus').textContent = t.status_searching;
  const img = new Image();
  img.onload = async () => {
    photoImg = img;
    processedCache = null;
    panX = 0; panY = 0; userZoom = 1.0;
    document.getElementById('zoomRange').value = 100;
    document.getElementById('zoomVal').textContent = '1.00×';
    faceBox = await detectFace(img);
    document.getElementById('cropStatus').textContent = faceBox.detected ? t.status_found : t.status_not_found;
    document.getElementById('uploadLabel').textContent = file.name.slice(0, 16);
    document.getElementById('uploadArea').classList.add('has-photo');
    render();
  };
  img.src = URL.createObjectURL(file);
}

// === Drag ===
function initDrag() {
  const mainCv = document.getElementById('cv-main');
  let dragging = false, lastX = 0, lastY = 0;
  mainCv.addEventListener('mousedown', e => {
    if (!photoImg) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    mainCv.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = mainCv.getBoundingClientRect();
    const scale = 1 / rect.width;
    panX += (e.clientX - lastX) * scale;
    panY += (e.clientY - lastY) * scale;
    panX = Math.max(-0.8, Math.min(0.8, panX));
    panY = Math.max(-0.8, Math.min(0.8, panY));
    lastX = e.clientX; lastY = e.clientY;
    processedCache = null;
    render();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    mainCv.style.cursor = 'move';
  });
  mainCv.addEventListener('touchstart', e => {
    if (!photoImg || !e.touches[0]) return;
    dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    e.preventDefault();
  });
  mainCv.addEventListener('touchmove', e => {
    if (!dragging || !e.touches[0]) return;
    const rect = mainCv.getBoundingClientRect();
    const scale = 1 / rect.width;
    panX += (e.touches[0].clientX - lastX) * scale;
    panY += (e.touches[0].clientY - lastY) * scale;
    panX = Math.max(-0.8, Math.min(0.8, panX));
    panY = Math.max(-0.8, Math.min(0.8, panY));
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    processedCache = null;
    render();
    e.preventDefault();
  });
  mainCv.addEventListener('touchend', () => { dragging = false; });
}

// === Image processing ===
function computeHalfFaceCrop(srcImg, srcFaceBox, zoomVal, pX, pY) {
  if (!srcFaceBox) return null;
  const faceCenterX = srcFaceBox.x + srcFaceBox.w / 2;
  const faceCenterY = srcFaceBox.y + srcFaceBox.h / 2;
  const faceSize = Math.max(srcFaceBox.w, srcFaceBox.h);
  const baseCropSize = faceSize * 1.35;
  const cropSize = baseCropSize / zoomVal;
  const cx = faceCenterX + cropSize * 0.32 + pX * cropSize * 0.6;
  const cy = faceCenterY + cropSize * 0.05 + pY * cropSize * 0.6;
  return {sx: cx - cropSize/2, sy: cy - cropSize/2, size: cropSize};
}

function applyMonoFilter(data, fxName) {
  if (fxName === 'bw') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      const c = Math.min(255, Math.max(0, (lum - 128) * 1.2 + 128));
      data[i] = data[i+1] = data[i+2] = c;
    }
  } else if (fxName === 'hicon') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      const c = Math.min(255, Math.max(0, (lum - 128) * 1.7 + 128));
      data[i] = data[i+1] = data[i+2] = c;
    }
  } else if (fxName === 'soft') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      const c = Math.min(255, Math.max(0, (lum - 128) * 0.85 + 148));
      data[i] = data[i+1] = data[i+2] = c;
    }
  } else if (fxName === 'silver') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      const c = Math.min(255, Math.max(0, (lum - 128) * 1.1 + 135));
      data[i] = Math.min(255, c * 0.97);
      data[i+1] = Math.min(255, c * 0.99);
      data[i+2] = Math.min(255, c * 1.03);
    }
  } else if (fxName === 'grain') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      const c = Math.min(255, Math.max(0, (lum - 128) * 1.15 + 128));
      const n = (Math.random() - 0.5) * 32;
      const final = Math.min(255, Math.max(0, c + n));
      data[i] = data[i+1] = data[i+2] = final;
    }
  } else if (fxName === 'ink') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      let c = (lum - 115) * 2.2 + 115;
      c = Math.min(255, Math.max(0, c));
      data[i] = data[i+1] = data[i+2] = c;
    }
  } else if (fxName === 'sepia') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114;
      const c = Math.min(255, Math.max(0, (lum - 128) * 1.15 + 128)) / 255;
      data[i] = Math.round(255 * Math.pow(c, 0.85) * 0.98);
      data[i+1] = Math.round(255 * Math.pow(c, 0.95) * 0.82);
      data[i+2] = Math.round(255 * Math.pow(c, 1.1) * 0.6);
    }
  } else if (fxName === 'bluemono') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114) / 255;
      data[i] = Math.round(10 + (150 - 10) * lum);
      data[i+1] = Math.round(20 + (180 - 20) * lum);
      data[i+2] = Math.round(50 + (255 - 50) * lum);
    }
  } else if (fxName === 'violetmono') {
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114) / 255;
      data[i] = Math.round(25 + (180 - 25) * lum);
      data[i+1] = Math.round(15 + (130 - 15) * lum);
      data[i+2] = Math.round(50 + (240 - 50) * lum);
    }
  }
}

function getProcessed(size) {
  const key = `${size}-${fx}-${userZoom.toFixed(2)}-${panX.toFixed(3)}-${panY.toFixed(3)}`;
  if (processedCache && cacheKey === key) return processedCache;
  if (!photoImg) return null;
  const oc = document.createElement('canvas');
  oc.width = size; oc.height = size;
  const ctx = oc.getContext('2d');
  ctx.fillStyle = '#0f0f12';
  ctx.fillRect(0, 0, size, size);
  const crop = computeHalfFaceCrop(photoImg, faceBox, userZoom, panX, panY);
  if (crop) {
    ctx.drawImage(photoImg, crop.sx, crop.sy, crop.size, crop.size, 0, 0, size, size);
  } else {
    const baseSize = Math.min(photoImg.width, photoImg.height);
    const cropSize = baseSize / userZoom;
    const cx = photoImg.width / 2 - panX * baseSize;
    const cy = photoImg.height / 2 - panY * baseSize;
    let sx = cx - cropSize/2;
    let sy = cy - cropSize/2;
    sx = Math.max(0, Math.min(photoImg.width - cropSize, sx));
    sy = Math.max(0, Math.min(photoImg.height - cropSize, sy));
    ctx.drawImage(photoImg, sx, sy, cropSize, cropSize, 0, 0, size, size);
  }
  const imgData = ctx.getImageData(0, 0, size, size);
  applyMonoFilter(imgData.data, fx);
  ctx.putImageData(imgData, 0, 0);
  processedCache = oc; cacheKey = key;
  return oc;
}

function processSample(srcImg, fxName, size) {
  const oc = document.createElement('canvas');
  oc.width = size; oc.height = size;
  const ctx = oc.getContext('2d');
  ctx.fillStyle = '#0f0f12';
  ctx.fillRect(0, 0, size, size);
  const w = srcImg.width, h = srcImg.height;
  const faceW = Math.min(w, h) * 0.55;
  const fb = {x: w/2 - faceW/2, y: h*0.4 - faceW/2, w: faceW, h: faceW};
  const crop = computeHalfFaceCrop(srcImg, fb, 1.0, 0, 0);
  if (crop) {
    ctx.drawImage(srcImg, crop.sx, crop.sy, crop.size, crop.size, 0, 0, size, size);
  } else {
    ctx.drawImage(srcImg, 0, 0, size, size);
  }
  const imgData = ctx.getImageData(0, 0, size, size);
  applyMonoFilter(imgData.data, fxName);
  ctx.putImageData(imgData, 0, 0);
  return oc;
}

function drawSilhouette(ctx, S) {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#2a2438';
  ctx.beginPath();
  ctx.arc(S*0.62, S*0.40, S*0.22, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(S*0.62, S*0.95, S*0.42, S*0.32, 0, Math.PI, 0);
  ctx.fill();
}

function renderAvatarComposition(ctx, S, opts) {
  opts = opts || {};
  const useRegion = opts.region || region;
  const useDept = opts.dept || dept;
  const customImg = opts.customImg;
  const ringWidth = S * 0.075;
  const ringRadius = S/2 - ringWidth/2;
  ctx.clearRect(0, 0, S, S);
  ctx.save();
  ctx.beginPath();
  ctx.arc(S/2, S/2, S/2, 0, Math.PI*2);
  ctx.clip();
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, S, S);
  if (violetLogo.complete && violetLogo.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.13;
    const lSize = S * 0.85;
    ctx.drawImage(violetLogo, S/2 - lSize/2, S/2 - lSize/2, lSize, lSize);
    ctx.restore();
  }
  if (customImg) {
    ctx.drawImage(customImg, 0, 0, S, S);
  } else if (photoImg) {
    const p = getProcessed(S);
    if (p) ctx.drawImage(p, 0, 0, S, S);
  } else {
    drawSilhouette(ctx, S);
  }
  ctx.restore();
  const cx = S/2, cy = S/2;
  const grad = ctx.createLinearGradient(S*0.1, S*0.1, S*0.9, S*0.9);
  grad.addColorStop(0, useDept.neon[0]);
  grad.addColorStop(1, useDept.neon[1]);
  ctx.strokeStyle = grad;
  ctx.lineWidth = ringWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius, 0, Math.PI*2);
  ctx.stroke();
  const innerGlow = ctx.createRadialGradient(cx, cy, S/2 - S*0.08, cx, cy, S/2);
  innerGlow.addColorStop(0, 'rgba(255,255,255,0)');
  innerGlow.addColorStop(1, useDept.neon[1] + '33');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, S/2, 0, Math.PI*2);
  ctx.fill();
  if (violetLogo.complete && blueLogo.complete && violetLogo.naturalWidth > 0) {
    const lo = useRegion === 'RU' ? blueLogo : violetLogo;
    const badgeSize = S * 0.44;
    const bx = S * 0.78;
    const by = S * 0.78;
    ctx.drawImage(lo, bx - badgeSize/2, by - badgeSize/2, badgeSize, badgeSize);
  }
}

function renderTo(canvasId) {
  const cv = document.getElementById(canvasId);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cv.width/2, cv.height/2, cv.width/2, 0, Math.PI*2);
  ctx.clip();
  renderAvatarComposition(ctx, cv.width);
  ctx.restore();
}

function renderSamples() {
  if (!sampleMale.complete || !sampleFemale.complete) return;
  if (sampleMale.naturalWidth === 0) return;
  const sampleDeptM = DEPTS.find(d => d.id === 'dev');
  const sampleDeptF = DEPTS.find(d => d.id === 'mkt');
  const processedM = processSample(sampleMale, 'bw', 200);
  const processedF = processSample(sampleFemale, 'bw', 200);
  const cm = document.getElementById('sample-m');
  if (cm) {
    const ctx = cm.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cm.width/2, cm.height/2, cm.width/2, 0, Math.PI*2);
    ctx.clip();
    renderAvatarComposition(ctx, cm.width, {region: 'RU', dept: sampleDeptM, customImg: processedM});
    ctx.restore();
  }
  const cf = document.getElementById('sample-f');
  if (cf) {
    const ctx = cf.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cf.width/2, cf.height/2, cf.width/2, 0, Math.PI*2);
    ctx.clip();
    renderAvatarComposition(ctx, cf.width, {region: 'GL', dept: sampleDeptF, customImg: processedF});
    ctx.restore();
  }
}

function render() {
  processedCache = null;
  renderTo('cv-main');
  renderTo('cv-md');
  renderTo('cv-sm');
  renderTo('cv-xs');
}

function download() {
  processedCache = null;
  const off = document.createElement('canvas');
  off.width = exportSize; off.height = exportSize;
  const ctx = off.getContext('2d');
  ctx.save();
  ctx.beginPath();
  ctx.arc(exportSize/2, exportSize/2, exportSize/2, 0, Math.PI*2);
  ctx.clip();
  renderAvatarComposition(ctx, exportSize);
  ctx.restore();
  const a = document.createElement('a');
  a.download = `restaff-${dept.id}-${region}-${exportSize}.png`;
  a.href = off.toDataURL('image/png');
  a.click();
}

// === Hero render для лендинга ===
// === Init ===
window.addEventListener('DOMContentLoaded', () => {
  applyLang(currentLang);
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
  renderDeptList();
  initDrag();

  const savedUser = localStorage.getItem('restaff_user');
  if (savedUser) {
    const domain = savedUser.split('@')[1];
    if (ALLOWED_DOMAINS.includes(domain)) {
      currentUser = savedUser;
      showApp();
    }
  }
});
