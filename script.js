// script.js — theme toggle, header scroll, nav, modal, canvas background,
// animasi statistik Experience, dan animasi chart (efek naik/turun seperti saham)

document.addEventListener('DOMContentLoaded', () => {
  // ---------- theme toggle ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  let currentTheme = root.getAttribute('data-theme') || 'dark';
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
    });
  }

  // ---------- header scroll state ----------
  const header = document.getElementById('siteHeader');
  const onScroll = () => { if (!header) return; header.classList.toggle('scrolled', window.scrollY > 20); };
  window.addEventListener('scroll', onScroll);
  onScroll();

  // ---------- hamburger nav ----------
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navOverlay = document.getElementById('navOverlay');
  const navDrawer = document.getElementById('navDrawer');
  function toggleNav(force) {
    if (!navDrawer || !navOverlay || !hamburgerBtn) return;
    const open = force !== undefined ? force : !navDrawer.classList.contains('active');
    navDrawer.classList.toggle('active', open);
    navOverlay.classList.toggle('active', open);
    hamburgerBtn.classList.toggle('open', open);
  }
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => toggleNav());
  if (navOverlay) navOverlay.addEventListener('click', () => toggleNav(false));
  if (navDrawer) document.querySelectorAll('.nav-drawer a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

  // ---------- experience detail modal ----------
  const detailBtn = document.getElementById('detailBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  if (detailBtn && modalOverlay) detailBtn.addEventListener('click', () => modalOverlay.classList.add('active'));
  if (modalClose && modalOverlay) modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });

  // ---------- network node background (hero signature) ----------
  const canvas = document.getElementById('netCanvas');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let nodes = [];

    function resizeCanvas() {
      const hero = canvas.parentElement;
      if (!hero) return;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    function initNodes() {
      const count = Math.floor((canvas.width * canvas.height) / 32000);
      nodes = Array.from({ length: Math.min(count, 55) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25
      }));
    }
    function getAccentColor() { return getComputedStyle(root).getPropertyValue('--accent').trim() || '#4CC9F0'; }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = getAccentColor();
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - dist / 150) * 0.35;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      for (const n of nodes) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resizeCanvas(); initNodes();
    window.addEventListener('resize', () => { resizeCanvas(); initNodes(); });
    draw();
  }

  // ---------- Experience stats animation (naik/turun) ----------
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  const statNodes = Array.from(document.querySelectorAll('.exp-stats div b'));
  if (statNodes.length > 0) {
    const stats = statNodes.map(node => {
      const text = node.textContent.trim();
      const sign = text.startsWith('+') ? '+' : (text.startsWith('-') ? '-' : '');
      const digits = text.replace(/[^\d.-]/g, '');
      const value = Number(digits) || 0;
      return { node, value, sign, formatted: text, animValue: value, target: value };
    });

    function renderStat(s) {
      const suffixMatch = s.formatted.match(/[%a-zA-Z\s]*$/);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      const sign = s.sign === '-' ? '-' : (s.animValue > 0 ? '+' : (s.sign === '+' ? '+' : ''));
      s.node.textContent = `${sign}${Math.round(s.animValue)}${suffix}`;
    }

    function animateTo(s, newTarget, duration = 800) {
      const start = performance.now(), from = s.animValue, to = newTarget;
      s.target = to;
      const direction = to > from ? 'up' : (to < from ? 'down' : 'none');
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = easeOutCubic(t);
        s.animValue = from + (to - from) * eased;
        renderStat(s);
        if (t < 1) requestAnimationFrame(frame);
        else {
          s.animValue = to; renderStat(s);
          s.node.classList.remove('pulse-up', 'pulse-down');
          void s.node.offsetWidth;
          if (direction === 'up') { s.node.classList.add('pulse-up'); s.node.classList.remove('stat-down'); s.node.classList.add('stat-up'); }
          else if (direction === 'down') { s.node.classList.add('pulse-down'); s.node.classList.remove('stat-up'); s.node.classList.add('stat-down'); }
        }
      }
      requestAnimationFrame(frame);
    }

    stats.forEach(s => { if (!s.node.classList.contains('stat-up') && !s.node.classList.contains('stat-down')) { if (s.value >= 0) s.node.classList.add('stat-up'); else s.node.classList.add('stat-down'); } renderStat(s); });

    function nextRound() {
      stats.forEach((s, idx) => {
        const base = s.value;
        const bias = (idx % 2 === 0) ? 0.6 : 0;
        const maxDelta = Math.max(2, Math.round(Math.abs(base) * 0.06));
        const minDelta = -Math.max(2, Math.round(Math.abs(base) * 0.04));
        let delta = Math.floor(Math.random() * (maxDelta - minDelta + 1)) + minDelta;
        if (Math.random() < bias) delta = Math.abs(delta);
        if (Math.random() < 0.08) delta += (Math.random() < 0.6 ? 2 : -2);
        let newTarget = Math.round(s.target + delta);
        newTarget = Math.max(-20, Math.min(150, newTarget));
        animateTo(s, newTarget, 900 + Math.round(Math.random() * 500));
      });
      const next = 2200 + Math.round(Math.random() * 3000);
      setTimeout(nextRound, next);
    }

    if (!reduceMotion) setTimeout(nextRound, 650);
    else stats.forEach(s => { s.animValue = s.value; renderStat(s); s.node.classList.remove('pulse-up', 'pulse-down'); });

    const expCard = document.querySelector('.exp-card');
    if (expCard) expCard.addEventListener('mouseenter', () => {
      stats.forEach((s) => {
        const delta = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.round(Math.random() * 3));
        let nt = Math.round(s.target + delta); nt = Math.max(-20, Math.min(150, nt));
        animateTo(s, nt, 500);
      });
    });
  }

  // ---------- Chart animation: buat polyline & polygon "bergerak" seperti saham ----------
  const charts = Array.from(document.querySelectorAll('.chart-box svg'));
  charts.forEach(svg => {
    const polyline = svg.querySelector('polyline');
    const polygon = svg.querySelector('polygon');
    if (!polyline) return;
    // viewBox, fallback to 400x180 if missing
    const vb = (svg.viewBox && svg.viewBox.baseVal) ? svg.viewBox.baseVal : { width: 400, height: 180 };
    // parse initial points into array
    const pointPairs = polyline.getAttribute('points').trim().split(/\s+/).map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y, baseY: y, phase: Math.random() * Math.PI * 2, amp: 6 + Math.random() * 18, speed: 0.6 + Math.random() * 1.0 };
    });

    // create live dot if not present
    let liveDot = svg.querySelector('.live-dot');
    if (!liveDot) {
      liveDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      liveDot.setAttribute('r', 6);
      liveDot.setAttribute('class', 'live-dot');
      const fillColor = getComputedStyle(root).getPropertyValue('--up').trim() || '#38D48A';
      liveDot.setAttribute('fill', fillColor);
      svg.appendChild(liveDot);
    }

    // small helper to update fill color on theme changes
    const updateDotColor = () => {
      const fillColor = getComputedStyle(root).getPropertyValue('--up').trim() || '#38D48A';
      liveDot.setAttribute('fill', fillColor);
    };
    // watch theme toggle: update color on attribute changes
    const mo = new MutationObserver(() => updateDotColor());
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // time-driven wave animation (smooth)
    let start = performance.now();
    function frame(now) {
      const t = (now - start) / 1000;
      // compute y for each point using sine waves per-point
      const yVals = pointPairs.map(pt => {
        // base gentle wave
        let y = pt.baseY + Math.sin(t * pt.speed + pt.phase) * pt.amp;
        // clamp within viewport with small margin
        y = Math.max(6, Math.min(vb.height - 6, y));
        return y;
      });

      // occasionally do a spike/drop to feel like a stock jump (infrequent)
      if (Math.random() < 0.006) {
        const idx = Math.floor(Math.random() * pointPairs.length);
        pointPairs[idx].amp = 28 + Math.random() * 28;
        // recover amplitude after a short duration
        setTimeout(() => { pointPairs[idx].amp = 6 + Math.random() * 18; }, 600 + Math.random() * 1400);
      }

      // set polyline points
      const polyPts = pointPairs.map((pt, i) => `${pt.x},${yVals[i].toFixed(1)}`).join(' ');
      polyline.setAttribute('points', polyPts);

      // update polygon fill area to follow polyline then bottom-right / bottom-left
      const polyFill = `${polyPts} ${vb.width},${vb.height} 0,${vb.height}`;
      if (polygon) polygon.setAttribute('points', polyFill);

      // move live-dot to last point
      const lastIdx = pointPairs.length - 1;
      const lastX = pointPairs[lastIdx].x;
      const lastY = yVals[lastIdx];
      liveDot.setAttribute('cx', lastX);
      liveDot.setAttribute('cy', lastY);

      if (!reduceMotion) requestAnimationFrame(frame);
    }

    // start animation (respect reduced-motion)
    if (!reduceMotion) requestAnimationFrame(frame);
    else {
      // if reduced-motion, leave shapes static and position dot at final point
      const last = pointPairs[pointPairs.length - 1];
      liveDot.setAttribute('cx', last.x);
      liveDot.setAttribute('cy', last.y);
    }
  });

  // cleanup placeholder (optional)
  window.addEventListener('beforeunload', () => { /* nothing heavy to clean */ });
});

const certDetailBtn   = document.getElementById('certDetailBtn');
const certModalOverlay = document.getElementById('certModalOverlay');
const certModalClose  = document.getElementById('certModalClose');

certDetailBtn?.addEventListener('click', () => {
  certModalOverlay.classList.add('active'); // ganti 'active' sesuai class yang dipakai modal experience
});
certModalClose?.addEventListener('click', () => {
  certModalOverlay.classList.remove('active');
});
certModalOverlay?.addEventListener('click', (e) => {
  if (e.target === certModalOverlay) certModalOverlay.classList.remove('active');
});

/* ===== CUSTOM CURSOR (DESKTOP) + TOUCH TRAIL (HP) ===== */
(function(){
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const isTouch = window.matchMedia('(hover:none), (pointer:coarse)').matches;

  if(!isTouch && dot && ring){
    let mouseX=0, mouseY=0, ringX=0, ringY=0;

    window.addEventListener('mousemove', (e)=>{
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
    });

    function animateRing(){
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const hoverTargets = document.querySelectorAll(
      'a, button, .icon-btn, .hamburger, .btn-primary, .btn-outline, .skill-card, .edu-card, .contact-card, .ai-chip, .project-card, img'
    );
    hoverTargets.forEach(el=>{
      el.addEventListener('mouseenter', ()=>document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', ()=>document.body.classList.remove('cursor-hover'));
    });
  }

  if(isTouch){
    let lastTime = 0;
    window.addEventListener('touchmove', (e)=>{
      const now = Date.now();
      if(now - lastTime < 40) return; // throttle biar ringan di HP
      lastTime = now;
      const touch = e.touches[0];
      if(!touch) return;
      const rip = document.createElement('div');
      rip.className = 'touch-ripple';
      rip.style.left = touch.clientX + 'px';
      rip.style.top = touch.clientY + 'px';
      document.body.appendChild(rip);
      setTimeout(()=>rip.remove(), 650);
    }, {passive:true});
  }
})();

const albumDetailBtn = document.getElementById('albumDetailBtn');
const albumModalOverlay = document.getElementById('albumModalOverlay');
const albumModalClose = document.getElementById('albumModalClose');

if (albumDetailBtn && albumModalOverlay) {
  albumDetailBtn.addEventListener('click', () => {
    albumModalOverlay.classList.add('active'); // sesuaikan dengan class yang dipakai modal lain (misal: 'show')
  });
  albumModalClose.addEventListener('click', () => {
    albumModalOverlay.classList.remove('active');
  });
  albumModalOverlay.addEventListener('click', (e) => {
    if (e.target === albumModalOverlay) albumModalOverlay.classList.remove('active');
  });
}
