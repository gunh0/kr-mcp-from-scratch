// ==========================================================================
// MCP 야호~! 학습자료 — 인터랙션 스크립트
// (배경 파티클, 히어로 3D 오브젝트, XP바/레벨, 퀘스트 내비, 카드 3D 틸트, 섹션 등장 애니메이션)
// ==========================================================================

/* ---------------------------- 1) 배경 스타필드 ---------------------------- */
(function initStarfield() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, stars;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeStars(count) {
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.25 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(6,7,13,1)';
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      s.twinkle += 0.02;
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.4;
      ctx.beginPath();
      ctx.fillStyle = `rgba(200, 215, 255, ${Math.max(0, alpha)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      s.y += s.speed;
      if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    makeStars(Math.min(180, Math.floor((w * h) / 9000)));
  });

  resize();
  makeStars(Math.min(180, Math.floor((w * h) / 9000)));
  draw();
})();

/* ---------------------------- 2) 히어로 3D 오브젝트 (Three.js) ---------------------------- */
(function initHero3D() {
  const el = document.getElementById('hero-canvas');
  if (!el || typeof THREE === 'undefined') return;

  const width = 260, height = 260;
  const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 5;

  const group = new THREE.Group();
  scene.add(group);

  // 중심 코어: MCP의 "연결 허브"를 상징하는 정이십면체
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 0),
    new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true })
  );
  group.add(core);

  const coreFill = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 0),
    new THREE.MeshBasicMaterial({ color: 0x23d5ff, transparent: true, opacity: 0.08 })
  );
  group.add(coreFill);

  // 주변을 도는 3개의 "도구/데이터소스" 노드 — Tool, Resource, Prompt 를 상징
  const satelliteColors = [0x23d5ff, 0xff5cad, 0x4dff9a];
  const satellites = satelliteColors.map((color, i) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    const angle = (i / satelliteColors.length) * Math.PI * 2;
    mesh.userData.angle = angle;
    mesh.userData.radius = 2.1;
    mesh.userData.speed = 0.008 + i * 0.003;
    group.add(mesh);
    return mesh;
  });

  // 궤도 라인
  const orbitGeo = new THREE.RingGeometry(2.08, 2.1, 64);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x3a4270, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = Math.PI / 2.4;
  group.add(orbit);

  group.rotation.x = 0.4;

  let mouseX = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    core.rotation.y += 0.004;
    core.rotation.x += 0.001;
    coreFill.rotation.y -= 0.003;

    satellites.forEach((s) => {
      s.userData.angle += s.userData.speed;
      s.position.x = Math.cos(s.userData.angle) * s.userData.radius;
      s.position.z = Math.sin(s.userData.angle) * s.userData.radius;
    });

    group.rotation.y += (mouseX * 0.6 - group.rotation.y) * 0.02;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ---------------------------- 3) 스크롤 진행률 → XP바 / 레벨 뱃지 ---------------------------- */
(function initXpBar() {
  const bar = document.getElementById('xp-bar');
  const badge = document.getElementById('level-badge');
  const sections = Array.from(document.querySelectorAll('section'));

  const levelNames = [
    'LV.0 · INTRO',
    'LV.1 · MCP 개념',
    'LV.2 · 프로토콜 vs 서버',
    'LV.3 · Confluence-as-MCP',
    'LV.4 · RAG와 차이점 파악',
    'LV.5 · .claude 이해하기',
    'LV.6 · 직접 구현해보기',
    'LV.7 · 로드맵',
  ];

  function update() {
    const scrollTop = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0;
    bar.style.width = pct + '%';

    let currentIdx = 0;
    sections.forEach((sec, i) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) currentIdx = i;
    });
    // 배열보다 섹션이 많아도 INTRO로 되돌아가지 않도록 마지막 이름으로 클램프
    badge.textContent = levelNames[Math.min(currentIdx, levelNames.length - 1)];
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------------------------- 4) 퀘스트 사이드 내비게이션 ---------------------------- */
(function initQuestNav() {
  const links = Array.from(document.querySelectorAll('#quest-nav a'));
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));

  function update() {
    let activeIdx = 0;
    targets.forEach((t, i) => {
      if (!t) return;
      const rect = t.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) activeIdx = i;
    });
    links.forEach((a, i) => a.classList.toggle('active', i === activeIdx));
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------------------------- 5) 섹션 등장(레벨 언락) 순차 발현 애니메이션 ---------------------------- */
// 각 장표(section) 안의 요소에 등장 순서(--rv-d 지연)를 부여해 두고,
// 장표가 화면에 걸리면 LEVEL 태그 → 제목 → 본문 → 칩/플로우 → 카드 순으로 하나씩 발현된다.
(function initRevealObserver() {
  const sections = document.querySelectorAll('section');

  const REVEAL_SELECTOR = [
    'h1', '.hero-desc', '.meta-row', '.scroll-cue',   // 히어로 전용
    '.eyebrow', 'h2', 'p.lead',                        // 장표 머리
    '.chip', '.flow .node', '.flow .arrow',            // 칩 / 플로우 다이어그램
    '.spec-core', '.lane',                             // 전송 방식 다이어그램
    '.card', 'table.compare', '.code-label', 'pre', '.t-item', // 카드 / 표 / 코드 / 타임라인
  ].join(', ');

  const STEP = 0.09;      // 요소 간 발현 간격(초)
  const BOX_STEP = 0.24;  // 카드/레인 박스끼리는 더 뚜렷하게 한 박자씩 순차 발현
  const MAX_DELAY = 2.2;

  sections.forEach((sec) => {
    let i = 0;
    let boxIdx = 0;
    sec.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      el.classList.add('rv');
      let d = i * STEP;
      if (el.matches('.card, .lane')) {
        d += boxIdx * BOX_STEP;
        boxIdx += 1;
      }
      el.style.setProperty('--rv-d', `${Math.min(d, MAX_DELAY).toFixed(2)}s`);
      i += 1;
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    },
    { threshold: 0.22 }
  );
  sections.forEach((s) => io.observe(s));
})();

/* ---------------------------- 6) 카드 3D 틸트 (마우스 인터랙션) ---------------------------- */
(function initTiltCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -14;
      const rotateY = ((x / rect.width) - 0.5) * 14;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
    });
  });
})();
