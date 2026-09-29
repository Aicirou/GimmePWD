/**
 * GOTAPWD4U - Modern Tactical Engine
 * Interactive particle physics, cryptographic scramble decryption, 3D tilt, and Web Audio SFX.
 */

// ==========================================
// 1. FAST COMPACT 3D SIMPLEX NOISE IMPLEMENTATION
// ==========================================
class SimplexNoise {
  constructor(seed = Math.random()) {
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    // Shuffle with seed
    let s = Math.floor(seed * 65536);
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = (s >>> 16) % (i + 1);
      const tmp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = tmp;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
  }

  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  noise3D(xin, yin, zin) {
    let n0, n1, n2, n3;
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;

    let i1, j1, k1;
    let i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[this.perm[ii + this.perm[jj + this.perm[kk]]] % 12], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(this.grad3[this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12], x3, y3, z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

// ==========================================
// 2. WEB AUDIO MICRO-SFX ENGINE
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem("gotapwd_sound") !== "false";
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("gotapwd_sound", this.enabled);
    return this.enabled;
  }

  playMechanicalClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) { }
  }

  playCopySound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Slightly different from re-roll to give it a unique but calm identity (like a softer mechanical latch)
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) { }
  }
}

const sfx = new SoundFX();

// ==========================================
// 3. CORE PASSWORD GENERATOR & SCRAMBLE
// ==========================================
const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  number: "0123456789",
  symbol: "!@#$%^&*([{_;:,.?/<'>}])",
};

const COLOR_MAP = {
  uppercase: "#00f5a0",
  lowercase: "#38bdf8",
  number: "#fbbf24",
  symbol: "#e879f9",
};

let currentPassword = "";
let currentLength = 21;
let isScrambling = false;

// Cryptographically secure random integer in [0, max - 1]
function getSecureRandomInt(max) {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

function getCharacterCategory(char) {
  if (/[A-Z]/.test(char)) return "uppercase";
  if (/[a-z]/.test(char)) return "lowercase";
  if (/\d/.test(char)) return "number";
  return "symbol";
}

function generateCryptographicPassword(length = 21) {
  const categories = Object.keys(CHARACTER_SETS);
  let pwdArray = [];

  // Guarantee at least one character from each category
  categories.forEach((cat) => {
    const chars = CHARACTER_SETS[cat];
    pwdArray.push(chars[getSecureRandomInt(chars.length)]);
  });

  // Combine full charset for the rest
  const fullCharset = categories.map((cat) => CHARACTER_SETS[cat]).join("");
  while (pwdArray.length < length) {
    pwdArray.push(fullCharset[getSecureRandomInt(fullCharset.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = pwdArray.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = pwdArray[i];
    pwdArray[i] = pwdArray[j];
    pwdArray[j] = temp;
  }

  return pwdArray.join("");
}

// Scramble Decryptor Animation
function renderPasswordWithScramble(targetPassword) {
  const passwordElement = document.getElementById("password");
  currentPassword = targetPassword;
  isScrambling = true;

  const length = targetPassword.length;
  const scrambleGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*?";
  const startTime = performance.now();
  const totalDuration = 360; // ms

  function updateFrame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / totalDuration);

    // Each character locks into place based on its position
    let html = "";
    for (let i = 0; i < length; i++) {
      const lockThreshold = (i + 1) / (length + 2);
      const isLocked = progress >= lockThreshold;

      const char = isLocked
        ? targetPassword[i]
        : scrambleGlyphs[Math.floor(Math.random() * scrambleGlyphs.length)];

      const cat = getCharacterCategory(isLocked ? char : targetPassword[i]);
      html += `<span class="char-item ${cat}" data-index="${i}">${char}</span>`;
    }

    passwordElement.innerHTML = html;

    if (progress < 1) {
      requestAnimationFrame(updateFrame);
    } else {
      isScrambling = false;
      updateStatistics(targetPassword);
      updateEntropy(targetPassword);
      if (swarm) swarm.updateCharacters(targetPassword);
    }
  }

  requestAnimationFrame(updateFrame);
}

// Statistics Badges & Hover Sync
function updateStatistics(password) {
  const counts = { uppercase: 0, lowercase: 0, number: 0, symbol: 0 };
  for (const char of password) {
    counts[getCharacterCategory(char)]++;
  }

  const badgesContainer = document.getElementById("countTypes");
  badgesContainer.innerHTML = Object.entries(counts)
    .map(([cat, count]) => `
      <div class="stat-badge badge-${cat}" data-category="${cat}">
        <span class="badge-dot"></span>
        <span>${cat.toUpperCase()}</span>
        <span class="badge-count">${count}</span>
      </div>
    `)
    .join("");

  // Attach hover events to badges to highlight corresponding characters
  badgesContainer.querySelectorAll(".stat-badge").forEach((badge) => {
    const cat = badge.dataset.category;
    badge.addEventListener("mouseenter", () => {
      const pwdEl = document.getElementById("password");
      pwdEl.classList.add("filter-active");
      pwdEl.querySelectorAll(`.char-item.${cat}`).forEach((el) => {
        el.classList.add("highlighted");
      });
    });

    badge.addEventListener("mouseleave", () => {
      const pwdEl = document.getElementById("password");
      pwdEl.classList.remove("filter-active");
      pwdEl.querySelectorAll(".char-item").forEach((el) => {
        el.classList.remove("highlighted");
      });
    });
  });
}

// Shannon Entropy Calculation
function updateEntropy(password) {
  const length = password.length;
  // Pool size based on 26 + 26 + 10 + 24 = 86
  const poolSize = 86;
  const entropyBits = Math.round(length * Math.log2(poolSize));

  const entropyFill = document.getElementById("entropyFill");
  const entropyText = document.getElementById("entropyText");

  let rating = "Weak";
  let percent = Math.min(100, Math.round((entropyBits / 180) * 100));

  if (entropyBits >= 130) {
    rating = "Quantum Resistant";
  } else if (entropyBits >= 100) {
    rating = "Military Grade";
  } else if (entropyBits >= 70) {
    rating = "Hardened";
  } else {
    rating = "Reasonable";
  }

  entropyFill.style.width = `${percent}%`;
  entropyText.textContent = `${entropyBits}-bit \u2022 ${rating}`;
}

// ==========================================
// 4. INTERACTIVE PHYSICS SWARM CANVAS
// ==========================================
class Particle {
  constructor(w, h, char) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = 0;
    this.vy = 0;
    this.noiseX = Math.random() * 500;
    this.noiseY = Math.random() * 500;
    this.speed = Math.random() * 0.00018 + 0.00008;
    this.char = char;
    this.category = getCharacterCategory(char);
    this.fontSize = Math.floor(Math.random() * 12 + 13);
    this.weight = Math.random() > 0.5 ? "600" : "400";
    this.baseAlpha = Math.random() * 0.35 + 0.15;
    this.alpha = this.baseAlpha;
  }

  update(noise, time, width, height, mouse, vortex, shockwaves) {
    // 1. Organic Simplex Noise Drift
    const nx = (noise.noise3D(this.noiseX, 0, time * this.speed) + 1) * 0.5 * width;
    const ny = (noise.noise3D(this.noiseY, 0, time * this.speed) + 1) * 0.5 * height;

    // Spring attraction towards noise anchor
    const kAnchor = 0.02;
    this.vx += (nx - this.x) * kAnchor;
    this.vy += (ny - this.y) * kAnchor;

    // 2. Cursor Repulsion & Wake
    if (mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      const repulseRadius = 140;

      if (distSq < repulseRadius * repulseRadius && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / repulseRadius) * 2.2;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;

        // Wake from cursor velocity
        this.vx += mouse.vx * 0.12 * (1 - dist / repulseRadius);
        this.vy += mouse.vy * 0.12 * (1 - dist / repulseRadius);
      }
    }

    // 3. Singularity / Vortex on Refresh
    if (vortex.active) {
      const dx = vortex.x - this.x;
      const dy = vortex.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Pull inward
      const pullForce = Math.min(6, (1200 / (dist + 40)) * vortex.strength);
      this.vx += (dx / dist) * pullForce;
      this.vy += (dy / dist) * pullForce;

      // Tangential angular swirl
      this.vx += (-dy / dist) * pullForce * 1.4;
      this.vy += (dx / dist) * pullForce * 1.4;
    }

    // 4. Copy Shockwave Ring Force
    for (const wave of shockwaves) {
      const dx = this.x - wave.x;
      const dy = this.y - wave.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const waveDiff = Math.abs(dist - wave.radius);

      if (waveDiff < 60) {
        const impulse = (1 - waveDiff / 60) * wave.power;
        this.vx += (dx / dist) * impulse;
        this.vy += (dy / dist) * impulse;
      }
    }

    // Damping / Friction
    this.vx *= 0.88;
    this.vy *= 0.88;

    this.x += this.vx;
    this.y += this.vy;

    // Edge wrapping
    if (this.x < -30) this.x = width + 30;
    if (this.x > width + 30) this.x = -30;
    if (this.y < -30) this.y = height + 30;
    if (this.y > height + 30) this.y = -30;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.weight} ${this.fontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = COLOR_MAP[this.category] || "#00f5a0";
    ctx.globalAlpha = this.alpha;
    ctx.fillText(this.char, this.x, this.y);
    ctx.restore();
  }
}

class SwarmEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.noise = new SimplexNoise();
    this.particles = [];
    this.particleCount = 280;
    this.mouse = { x: null, y: null, vx: 0, vy: 0, lastX: 0, lastY: 0 };
    this.vortex = { active: false, x: 0, y: 0, strength: 0 };
    this.shockwaves = [];
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;

    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseleave", () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    this.initParticles(currentPassword || "GotAPassword4U!2026");
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  initParticles(password) {
    this.particles = [];
    const len = password.length;
    for (let i = 0; i < this.particleCount; i++) {
      const char = password[i % len];
      this.particles.push(new Particle(this.width, this.height, char));
    }
  }

  updateCharacters(password) {
    const len = password.length;
    for (let i = 0; i < this.particles.length; i++) {
      const char = password[i % len];
      this.particles[i].char = char;
      this.particles[i].category = getCharacterCategory(char);
    }
  }

  onMouseMove(e) {
    const curX = e.clientX;
    const curY = e.clientY;
    if (this.mouse.x !== null) {
      this.mouse.vx = curX - this.mouse.lastX;
      this.mouse.vy = curY - this.mouse.lastY;
    }
    this.mouse.x = curX;
    this.mouse.y = curY;
    this.mouse.lastX = curX;
    this.mouse.lastY = curY;
  }

  triggerVortex(x, y) {
    this.vortex = { active: true, x, y, strength: 1 };
    setTimeout(() => {
      this.vortex.active = false;
      this.triggerShockwave(x, y, 16);
    }, 280);
  }

  triggerShockwave(x, y, power = 14) {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius: Math.max(this.width, this.height) * 0.9,
      speed: 26,
      power,
      alpha: 0.6,
    });
  }

  animate(time) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const wave = this.shockwaves[i];
      wave.radius += wave.speed;
      wave.alpha = Math.max(0, 0.6 * (1 - wave.radius / wave.maxRadius));

      if (wave.alpha > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 245, 160, ${wave.alpha * 0.5})`;
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = "#00f5a0";
        this.ctx.shadowBlur = 12;
        this.ctx.stroke();
        this.ctx.restore();
      }

      if (wave.radius >= wave.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Decay mouse velocity
    this.mouse.vx *= 0.85;
    this.mouse.vy *= 0.85;

    // Update & Draw Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.update(this.noise, time, this.width, this.height, this.mouse, this.vortex, this.shockwaves);
      p.draw(this.ctx);
    }

    requestAnimationFrame(this.animate);
  }
}

let swarm = null;

// ==========================================
// 5. 3D CARD PARALLAX & SPECULAR BORDER
// ==========================================
function setupCardTilt() {
  const card = document.getElementById("container");
  if (!card) return;

  let currentTiltX = 0;
  let currentTiltY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;

  window.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const mouseXRel = (e.clientX - cardCenterX) / (window.innerWidth / 2);
    const mouseYRel = (e.clientY - cardCenterY) / (window.innerHeight / 2);

    targetTiltY = mouseXRel * 6; // max 6 deg
    targetTiltX = -mouseYRel * 6;

    // Specular highlight coordinate inside card
    const cardMouseX = e.clientX - rect.left;
    const cardMouseY = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${cardMouseX}px`);
    card.style.setProperty("--mouse-y", `${cardMouseY}px`);
  });

  window.addEventListener("mouseleave", () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });

  function smoothTilt() {
    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltY += (targetTiltY - currentTiltY) * 0.1;
    card.style.setProperty('--tilt-x', `${currentTiltX.toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${currentTiltY.toFixed(2)}deg`);
    requestAnimationFrame(smoothTilt);
  }
  smoothTilt();
}

// ==========================================
// 6. CLIPBOARD & TITLE FLIP INTERACTION
// ==========================================
function copyPasswordToClipboard(e) {
  if (!currentPassword) return;

  const copy = () => {
    // Card recoil animation
    const card = document.getElementById("container");
    if (card) {
      card.classList.remove("card-recoil");
      void card.offsetWidth; // trigger reflow
      card.classList.add("card-recoil");
    }

    // Title flip: "Here ya go!" with glowing accents
    const titleEl = document.getElementById("title");
    titleEl.innerHTML = `
      <span class="title-color">Here</span>
      <span class="title-sub">ya go</span><span id="question-mark" class="exclamation" title="fuk uuu!">!</span>
    `;

    const copyBadgeText = document.getElementById("copyBadgeText");
    if (copyBadgeText) {
      copyBadgeText.textContent = "COPIED";
    }

    // Copy badge popup
    const copyBadge = document.getElementById("copyBadge");
    copyBadge.classList.add("visible");
    setTimeout(() => {
      copyBadge.classList.remove("visible");
    }, 1200);

    // Audio chime with rich personality
    sfx.playCopySound();

    // Trigger canvas shockwave from password position
    const pwdRect = document.getElementById("password").getBoundingClientRect();
    const centerX = e ? e.clientX : pwdRect.left + pwdRect.width / 2;
    const centerY = e ? e.clientY : pwdRect.top + pwdRect.height / 2;
    if (swarm) swarm.triggerShockwave(centerX, centerY, 16);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(currentPassword).then(copy).catch(() => {
      fallbackCopy(currentPassword);
      copy();
    });
  } else {
    fallbackCopy(currentPassword);
    copy();
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (_) { }
  document.body.removeChild(textArea);
}

// Re-roll Password
function refreshPassword() {
  const refreshBtn = document.getElementById("refreshButton");
  refreshBtn.classList.add("spinning");
  setTimeout(() => refreshBtn.classList.remove("spinning"), 500);

  // Card recoil animation
  const card = document.getElementById("container");
  if (card) {
    card.classList.remove("card-recoil");
    void card.offsetWidth; // trigger reflow
    card.classList.add("card-recoil");
  }

  // Audio click
  sfx.playMechanicalClick();

  // Reset title to resting inquiry
  const titleEl = document.getElementById("title");
  titleEl.innerHTML = `
    <span class="title-sub">Gimme a</span>
    <span class="title-color">random PWD</span><span id="question-mark" title="fuk uuu!">...?</span>
  `;

  // Singularity vortex physics toward button
  if (swarm) {
    const btnRect = refreshBtn.getBoundingClientRect();
    swarm.triggerVortex(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);
  }

  // Generate & scramble
  const newPwd = generateCryptographicPassword(currentLength);
  renderPasswordWithScramble(newPwd);
}

// ==========================================
// 7. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize canvas swarm
  const canvas = document.getElementById("bgCanvas");
  swarm = new SwarmEngine(canvas);

  // Initialize password
  currentLength = parseInt(document.getElementById("lengthSlider").value, 10) || 21;
  const initialPassword = generateCryptographicPassword(currentLength);
  renderPasswordWithScramble(initialPassword);

  // 3D card tilt - delayed to let the CSS entrance animation finish
  setTimeout(() => {
    document.getElementById("container").classList.remove("card-entrance");
    setupCardTilt();
  }, 1100);

  // Slider listener
  const slider = document.getElementById("lengthSlider");
  const lengthDisplay = document.getElementById("lengthDisplay");
  let sliderTimeout = null;

  slider.addEventListener("input", (e) => {
    currentLength = parseInt(e.target.value, 10);
    lengthDisplay.textContent = currentLength;
    clearTimeout(sliderTimeout);
    sliderTimeout = setTimeout(() => {
      refreshPassword();
    }, 40);
  });

  // Refresh button
  document.getElementById("refreshButton").addEventListener("click", refreshPassword);

  // Copy click on password container
  document.getElementById("password").addEventListener("click", (e) => {
    copyPasswordToClipboard(e);
  });

  // Copy click on copy button
  document.getElementById("copyButton").addEventListener("click", (e) => {
    copyPasswordToClipboard(e);
  });

  // Sound toggle button
  const soundBtn = document.getElementById("soundToggle");
  const onIcon = soundBtn.querySelector(".sound-on-icon");
  const offIcon = soundBtn.querySelector(".sound-off-icon");

  function updateSoundIcon(enabled) {
    onIcon.style.display = enabled ? "block" : "none";
    offIcon.style.display = enabled ? "none" : "block";
    soundBtn.title = enabled ? "Mute sound" : "Unmute sound";
  }
  updateSoundIcon(sfx.enabled);

  soundBtn.addEventListener("click", () => {
    const newState = sfx.toggle();
    updateSoundIcon(newState);
  });

  // Keyboard Shortcuts: Space Generate, Enter Copy (plus R / C)
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      refreshPassword();
    } else if (e.code === "Enter") {
      e.preventDefault();
      copyPasswordToClipboard();
    } else if (e.code === "KeyR" && e.target.tagName !== "INPUT") {
      e.preventDefault();
      refreshPassword();
    } else if (e.code === "KeyC" && e.target.tagName !== "INPUT") {
      e.preventDefault();
      copyPasswordToClipboard();
    }
  });
});
