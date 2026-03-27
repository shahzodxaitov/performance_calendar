/* ============================================
   PERFORMANCE_ — Interactive Scripts
   Premium Performance Landing Page
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Navbar Scroll Effect ───
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // ─── Mobile Menu Toggle ───
  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Scroll Reveal (Intersection Observer) ───
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animation for sibling elements
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        const siblingIndex = Array.from(siblings).indexOf(entry.target);
        const delay = siblingIndex * 100;

        setTimeout(() => {
          entry.target.classList.add('active');
        }, delay);

        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ─── Animated Counters ───
  const counterElements = document.querySelectorAll('.metric-card__value[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterElements.forEach(el => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (isDecimal) {
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ─── Animate Case Study Metrics (Count-up on scroll) ───
  const caseMetrics = document.querySelectorAll('.case-card__metric[data-target]');

  const caseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCaseMetric(entry.target);
        caseObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  caseMetrics.forEach(el => caseObserver.observe(el));

  function animateCaseMetric(el) {
    const target = parseInt(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);

      el.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ─── Smooth Anchor Scrolling ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ─── Parallax Glow Effect (subtle mouse tracking) ───
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const bg = hero.querySelector('.hero__bg');
      if (bg) {
        bg.style.setProperty('--glow-x', x + '%');
        bg.style.setProperty('--glow-y', y + '%');
      }
    });
  }

  // ─── Particle Network Canvas ───
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    let particles = [];
    let mouse = { x: null, y: null, radius: 120 };
    let animationId;

    // Colors from the Neon Matrix design system
    const COLORS = {
      cyan: [0, 229, 255],
      magenta: [204, 0, 255],
      violet: [217, 200, 255],
    };

    // Resize canvas to match container
    function resizeCanvas() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    }

    class Particle {
      constructor(w, h) {
        this.w = w;
        this.h = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseSize = Math.random() * 2 + 0.8;
        this.size = this.baseSize;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        // Pick a random color
        const colorKeys = Object.keys(COLORS);
        this.colorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        this.color = COLORS[this.colorKey];
        this.alpha = Math.random() * 0.5 + 0.3;
        this.baseAlpha = this.alpha;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(time) {
        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = this.w;
        if (this.x > this.w) this.x = 0;
        if (this.y < 0) this.y = this.h;
        if (this.y > this.h) this.y = 0;

        // Pulse
        this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15;
        this.size = this.baseSize + Math.sin(time * this.pulseSpeed * 1.5 + this.pulseOffset) * 0.4;

        // Mouse interaction — attract & glow
        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x += dx * force * 0.02;
            this.y += dy * force * 0.02;
            this.alpha = Math.min(1, this.baseAlpha + force * 0.6);
            this.size = this.baseSize + force * 2;
          }
        }
      }

      draw() {
        const [r, g, b] = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        ctx.fill();

        // Glow
        if (this.size > 1.5) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.08})`;
          ctx.fill();
        }
      }
    }

    function initParticles(w, h) {
      const area = w * h;
      const count = Math.min(Math.floor(area / 2800), 120);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(w, h));
      }
    }

    function drawConnections() {
      const maxDist = 100;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.15;
            const [r, g, b] = particles[i].color;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Draw connections to mouse
        if (mouse.x !== null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const opacity = (1 - dist / mouse.radius) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    function animate(time) {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Subtle radial gradient background
      const gradient = ctx.createRadialGradient(
        rect.width * 0.5, rect.height * 0.5, 0,
        rect.width * 0.5, rect.height * 0.5, rect.width * 0.6
      );
      gradient.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
      gradient.addColorStop(0.5, 'rgba(204, 0, 255, 0.015)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      particles.forEach(p => p.update(time));
      drawConnections();
      particles.forEach(p => p.draw());

      animationId = requestAnimationFrame(animate);
    }

    // Mouse events on the canvas
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 200);
    });

    // Start
    resizeCanvas();
    animate(0);
  }

});
