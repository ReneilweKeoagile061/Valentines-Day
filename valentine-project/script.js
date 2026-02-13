'use strict';

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const noMessage = document.getElementById("noMessage");
const music = document.getElementById("bgMusic");
const splash = document.getElementById("splash");
const isSuccessPage = document.body.classList.contains("success-page");

/* ─────────────────────────
   MUSIC (starts from beginning on every load / refresh / back)
   Starts as soon as cinematic intro appears; tap splash to start on mobile if blocked.
───────────────────────── */

if (music) {
  music.volume = 0.55;
  if (!isSuccessPage) {
    music.currentTime = 0;
  } else {
    var savedTime = sessionStorage.getItem("musicTime");
    if (savedTime !== null && savedTime !== "") {
      var t = parseFloat(savedTime);
      if (!isNaN(t) && t > 0) music.currentTime = t;
      sessionStorage.removeItem("musicTime");
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) music.pause();
  });

  if (!isSuccessPage) {
    music.addEventListener("timeupdate", function () {
      try { sessionStorage.setItem("musicTime", String(music.currentTime)); } catch (e) {}
    });
  }

  function startMusic() {
    try {
      var p = music.play();
      if (p && typeof p.then === "function") {
        p.catch(function () { playOnFirstInteraction(); });
      }
    } catch (e) {
      playOnFirstInteraction();
    }
  }

  function playOnFirstInteraction() {
    function once() {
      try {
        if (!isSuccessPage) music.currentTime = 0;
        music.play();
      } catch (err) {}
      document.removeEventListener("click", once);
      document.removeEventListener("touchstart", once);
    }
    document.addEventListener("click", once);
    document.addEventListener("touchstart", once, false);
  }

  startMusic();
}

/* ─────────────────────────
   CINEMATIC SPLASH SCREEN (tap to dismiss; tap also starts song on mobile)
───────────────────────── */
if (splash && !isSuccessPage) {
  function hideSplash() {
    splash.classList.add("splash-out");
    setTimeout(function () {
      splash.style.display = "none";
    }, 600);
  }
  function onSplashTap() {
    clearTimeout(splashTimeout);
    if (music) {
      try {
        music.currentTime = 0;
        music.play();
      } catch (e) {}
    }
    hideSplash();
  }
  var splashTimeout = setTimeout(hideSplash, 2800);
  splash.addEventListener("click", function () {
    onSplashTap();
  });
  splash.addEventListener("touchstart", function () {
    onSplashTap();
  }, false);
}

/* ─────────────────────────
   MAIN PAGE LOGIC
───────────────────────── */

if (!isSuccessPage && yesBtn && noBtn) {

  let noClickCount = 0;

  const messages = [
    "Are you sure Pearly? 🥺",
    "Really sure? 😢",
    "Last chance 😭",
    "Keoagile will cry...",
    "The pressure is rising 💕",
    "Just press Yes already 😌"
  ];

  // Move No button to random position inside the white card only
  const mainCard = document.getElementById("mainCard");
  function moveNoButton() {
    if (!mainCard) return;
    const margin = 16;
    const btnW = noBtn.offsetWidth;
    const btnH = noBtn.offsetHeight;
    const cardW = mainCard.offsetWidth;
    const cardH = mainCard.offsetHeight;
    const maxX = Math.max(0, cardW - btnW - margin * 2);
    const maxY = Math.max(0, cardH - btnH - margin * 2);
    const newX = margin + Math.random() * maxX;
    const newY = margin + Math.random() * maxY;
    noBtn.style.position = "absolute";
    noBtn.style.left = newX + "px";
    noBtn.style.top = newY + "px";
    noBtn.style.zIndex = "10";
  }

  // Run away when cursor/finger gets close – mobile: use smaller distance on small screens
  const RUN_AWAY_THROTTLE_MS = 280;
  let lastRunAway = 0;
  let lastNoButtonTouch = 0;

  function getRunAwayDistance() {
    const w = document.documentElement.clientWidth;
    return w < 400 ? Math.min(80, w * 0.22) : 100;
  }

  function isNearButton(clientX, clientY) {
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    return dist < getRunAwayDistance();
  }

  function tryRunAway(clientX, clientY) {
    if (!isNearButton(clientX, clientY)) return;
    const now = Date.now();
    if (now - lastRunAway < RUN_AWAY_THROTTLE_MS) return;
    lastRunAway = now;
    moveNoButton();
  }

  document.addEventListener("mousemove", (e) => tryRunAway(e.clientX, e.clientY));
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length) tryRunAway(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("touchstart", (e) => {
    lastNoButtonTouch = Date.now();
    moveNoButton();
    if (e.touches.length) tryRunAway(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  noBtn.addEventListener("click", () => {

    noClickCount++;

    // Update message
    const index = Math.min(noClickCount - 1, messages.length - 1);
    if (noMessage) noMessage.textContent = messages[index];

    // Escalating background glow
    document.body.style.background =
      `radial-gradient(circle,
        rgba(255,105,135,${Math.min(0.2 + noClickCount * 0.05, 0.6)}),
        #1a1a1a)`;

    // Grow Yes button
    if (noClickCount >= 3) {
      yesBtn.style.transform =
        `scale(${Math.min(1 + noClickCount * 0.1, 1.6)})`;
    }

    // Move button to new random position on click too
    moveNoButton();
  });

  // YES button cinematic transition (ignore if she just touched No – prevents accidental Yes on mobile)
  yesBtn.addEventListener("click", (e) => {
    if (Date.now() - lastNoButtonTouch < 500) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const card = document.getElementById("mainCard");

    card.style.transition =
      "all 0.6s cubic-bezier(.68,-0.55,.27,1.55)";
    card.style.transform = "scale(1.1)";
    card.style.boxShadow =
      "0 0 120px rgba(232,92,128,0.8)";

    setTimeout(function () {
      document.body.style.transition = "opacity 0.6s ease";
      document.body.style.opacity = "0";

      setTimeout(function () {
        try { sessionStorage.setItem("musicTime", String(music.currentTime)); } catch (e) {}
        window.location.href = "success.html";
      }, 600);

    }, 500);
  });
}

/* ─────────────────────────
   SUCCESS PAGE LOGIC
───────────────────────── */

if (isSuccessPage) {

  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  document.body.style.animation =
    "successGlow 4s ease-in-out infinite alternate";

  if (music) music.play().catch(() => {});

  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  const particles = [];

  class Particle {
    constructor() {
      const w = canvas ? canvas.width : window.innerWidth;
      const h = canvas ? canvas.height : window.innerHeight;
      this.x = Math.random() * w;
      this.y = -20;
      this.r = 4 + Math.random() * 6;
      this.color = ["#ff4d6d", "#ffd166", "#ff8fab"][
        Math.floor(Math.random() * 3)
      ];
      this.vy = 2 + Math.random() * 3;
    }
    update() {
      this.y += this.vy;
    }
    draw() {
      if (!ctx) return;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function launchConfetti() {
    if (!canvas || !ctx) return;
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }

    animate();
  }

  setTimeout(launchConfetti, 400);
}
