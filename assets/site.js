(() => {
  const $ = (selector, scope=document) => scope.querySelector(selector);
  const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('js-ready');

  // Current year, navigation and active page state.
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const navToggle = $('.nav-toggle');
  const navLinks = $('.navlinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(open));
      navLinks.classList.toggle('is-open', open);
    });
    $$('a', navLinks).forEach(link => link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
    }));
  }

  // Wrap heading words so individual words can rise into view.
  function splitHeading(el) {
    if (el.dataset.splitDone) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const parts = node.nodeValue.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(document.createTextNode(part));
        else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          frag.append(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.dataset.splitDone = 'true';
  }
  $$('.kinetic, .pagehero h1').forEach(splitHeading);

  // Scroll reveal fallback, also used if GSAP is not available.
  const revealTargets = $$('.section-heading, .pillar-card, .category-card, .photo-frame, .buyer-copy, .pagehero .container, main .card, main .cat, main .panel, main .product-card, main .faq details, .kinetic');
  revealTargets.forEach((el, index) => {
    if (!el.classList.contains('kinetic')) el.classList.add('reveal');
    if (el.matches('.pillar-card,.category-card,.photo-frame,.product-card')) el.style.transitionDelay = `${(index % 4) * 65}ms`;
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible', 'in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible', 'in-view'));
  }

  // Global pointer glow.
  let pointerFrame = 0;
  window.addEventListener('pointermove', e => {
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--pointer-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${e.clientY}px`);
      pointerFrame = 0;
    });
  }, { passive: true });

  // Hardware-accelerated 3D tilt for interactive image frames and cards.
  const tiltItems = $$('.tilt-card, .photo-frame, .category-card, .pillar-card');
  tiltItems.forEach(el => {
    let rect = null;
    let frame = 0;
    const reset = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--tz', '0px');
      el.style.setProperty('--scale', '1');
    };
    el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      if (!rect) rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(0.5 - y) * 9}deg`);
        el.style.setProperty('--ry', `${(x - 0.5) * 11}deg`);
        el.style.setProperty('--tz', `${12 + (1 - Math.abs(.5 - y) * 2) * 9}px`);
        el.style.setProperty('--scale', '1.012');
      });
    });
    el.addEventListener('pointerleave', () => { rect = null; if (frame) cancelAnimationFrame(frame); reset(); });
  });

  // Subtle z-depth based on scroll position without replacing pointer tilt transforms.
  let scrollFrame = 0;
  const depthItems = $$('.tilt-card, .photo-frame, .category-card, .pillar-card');
  const updateDepth = () => {
    depthItems.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > innerHeight + 80) return;
      const midpoint = r.top + r.height / 2;
      const distance = Math.abs(midpoint - innerHeight * .5) / innerHeight;
      const z = Math.max(0, 12 - distance * 16);
      el.style.setProperty('--scroll-z', `${z.toFixed(1)}px`);
    });
  };
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { updateDepth(); scrollFrame = 0; });
  }, { passive: true });
  updateDepth();

  // Scroll-triggered supply pipeline with geometry measured from the real cards.
  // This native implementation does not depend on the GSAP CDN.
  function initSupplyFlow() {
    const wrap = $('[data-flow]');
    if (!wrap) return;
    const grid = $('.flow-grid', wrap);
    const svg = $('.flow-svg', wrap);
    const layer = $('.flow-path-layer', svg);
    const steps = $$('.flow-step', wrap);
    if (!grid || !svg || !layer || steps.length < 2) return;

    let started = false;
    let resizeFrame = 0;
    let paths = [];

    function buildPaths() {
      const width = Math.max(1, wrap.clientWidth);
      const height = Math.max(1, wrap.scrollHeight);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.style.height = `${height}px`;
      layer.replaceChildren();
      paths = [];

      const gridLeft = grid.offsetLeft;
      const gridTop = grid.offsetTop;
      const cards = steps.map(step => {
        const icon = $('.flow-icon', step);
        return {
          x: gridLeft + step.offsetLeft,
          y: gridTop + step.offsetTop,
          w: step.offsetWidth,
          h: step.offsetHeight,
          iconY: gridTop + step.offsetTop + (icon ? icon.offsetTop + icon.offsetHeight / 2 : step.offsetHeight / 2)
        };
      });

      for (let i = 0; i < cards.length - 1; i++) {
        const a = cards[i];
        const b = cards[i + 1];
        let d;
        const sameRow = Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) < 8;
        if (sameRow) {
          const x1 = a.x + a.w + 1;
          const x2 = b.x - 2;
          const y1 = a.iconY;
          const y2 = b.iconY;
          const bend = Math.max(8, (x2 - x1) * .42);
          d = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
        } else {
          const x1 = a.x + a.w / 2;
          const x2 = b.x + b.w / 2;
          const y1 = a.y + a.h + 3;
          const y2 = b.y - 6;
          const bend = Math.max(7, (y2 - y1) * .42);
          d = `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'flow-path');
        path.setAttribute('d', d);
        path.setAttribute('marker-end', 'url(#flow-arrow)');
        layer.append(path);
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = started || reduceMotion ? '0' : `${length}`;
        paths.push({ path, length });
      }
    }

    function revealFlow() {
      if (started) return;
      started = true;
      steps.forEach((step, index) => {
        step.style.transitionDelay = reduceMotion ? '0ms' : `${index * 190}ms`;
        step.classList.add('in-view');
      });
      paths.forEach(({ path, length }, index) => {
        if (reduceMotion) {
          path.style.strokeDashoffset = '0';
          return;
        }
        const delay = index * 270 + 180;
        if (typeof path.animate === 'function') {
          path.animate(
            [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
            { duration: 850, delay, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }
          );
        } else {
          path.style.transition = `stroke-dashoffset 850ms cubic-bezier(.65,0,.35,1) ${delay}ms`;
          requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
        }
      });
    }

    buildPaths();
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealFlow();
    } else {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          revealFlow();
          observer.disconnect();
        }
      }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });
      observer.observe(wrap);
    }

    const refresh = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        buildPaths();
        resizeFrame = 0;
      });
    };
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(refresh);
      resizeObserver.observe(wrap);
      resizeObserver.observe(grid);
      steps.forEach(step => resizeObserver.observe(step));
    } else {
      window.addEventListener('resize', refresh, { passive: true });
    }
  }
  initSupplyFlow();

  // Keep the cinematic entrance treatment where GSAP is available.
  function initGSAP() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-copy > *', { y: 28, opacity: 0, duration: .8, stagger: .11, ease: 'power3.out', delay: .12 });
    gsap.from('.hero-stage', { y: 35, opacity: 0, duration: 1.1, ease: 'power3.out', delay: .25 });
    gsap.utils.toArray('.pillars-grid .pillar-card, .category-grid .category-card, .gallery-mosaic .photo-frame').forEach((el, i) => {
      gsap.from(el, { y: 28, opacity: 0, duration: .75, delay: (i % 3) * .07, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }
  if (document.readyState === 'complete') initGSAP();
  else window.addEventListener('load', initGSAP, { once: true });

  // Friendly fallback when a remote product photo is unavailable.
  $$('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = 'true';
      img.classList.add('image-unavailable');
      if (img.closest('.category-image,.photo-frame,.marquee-card')) {
        img.style.visibility = 'hidden';
        img.parentElement.style.background = 'linear-gradient(135deg,#eee4d7,#d7c7b1)';
      }
    }, { once: true });
  });
})();
