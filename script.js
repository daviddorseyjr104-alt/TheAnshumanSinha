/* =========================================================
   Anshuman Sinha — award-winning motion layer
   Stack: Lenis (smooth scroll) + GSAP + ScrollTrigger
   Everything degrades gracefully:
     - reduced motion  -> native scroll, no animation, final values
     - GSAP missing    -> js-motion removed, all content shown, static
     - touch / coarse  -> no custom cursor, no magnetic buttons
   ========================================================= */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer =
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Footer year (always) ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- References ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const mobile = document.getElementById("navMobile");

  /* ---------- Mobile menu (always, accessible) ---------- */
  if (toggle && mobile) {
    const setOpen = (open) => {
      mobile.hidden = !open;
      mobile.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(mobile.hidden));
    mobile.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => setOpen(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !mobile.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", (mq) => {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- Nav: shrink + auto-hide on scroll-down (always, cheap) ---------- */
  if (nav) {
    let last = 0;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 12);
      const menuOpen = mobile && !mobile.hidden;
      if (!menuOpen && y > 220 && y > last + 4) {
        nav.classList.add("is-hidden");
      } else if (y < last - 4 || y < 220) {
        nav.classList.remove("is-hidden");
      }
      last = y;
      ticking = false;
    };
    update();
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  }

  /* ---------- Counters ---------- */
  const counters = Array.prototype.slice.call(
    document.querySelectorAll(".stat__value[data-target]")
  );
  const fmt = (n) => n.toLocaleString("en-US");
  const setCountersFinal = () =>
    counters.forEach((el) => {
      el.textContent = fmt(parseInt(el.dataset.target, 10) || 0);
    });

  /* ---------- Hero video: autoplay only when motion is allowed ---------- */
  const heroVideo = document.querySelector("[data-hero-video]");
  if (heroVideo) {
    if (reduce) {
      // Show the poster, never play.
      heroVideo.removeAttribute("autoplay");
      try { heroVideo.pause(); } catch (e) {}
    } else {
      heroVideo.muted = true;
      heroVideo.setAttribute("aria-hidden", "true");
      const playAttempt = heroVideo.play();
      if (playAttempt && playAttempt.catch) playAttempt.catch(() => {});
    }
  }

  /* =========================================================
     INTERACTIVE COMPONENTS — always on (work without GSAP/Lenis
     and under reduced motion). Only decorative motion is gated.
     ========================================================= */

  /* ---------- Scroll progress bar ---------- */
  const progress = document.getElementById("scrollProgress");
  if (progress) {
    let pTick = false;
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = "scaleX(" + f + ")";
      pTick = false;
    };
    updateProgress();
    window.addEventListener(
      "scroll",
      () => {
        if (!pTick) {
          pTick = true;
          window.requestAnimationFrame(updateProgress);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", updateProgress);
  }

  /* ---------- Tabs (Work with me) ---------- */
  document.querySelectorAll("[data-tabs]").forEach((wrap) => {
    const tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab, false));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll("[data-accordion]").forEach((acc) => {
    const triggers = Array.prototype.slice.call(acc.querySelectorAll(".faq__trigger"));
    triggers.forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      // Collapse by default now that JS can animate open/close
      btn.setAttribute("aria-expanded", "false");
      if (panel) panel.classList.add("is-collapsed");
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        if (panel) panel.classList.toggle("is-collapsed", open);
      });
    });
  });

  /* ---------- Testimonials carousel ---------- */
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const track = carousel.querySelector("[data-carousel-track]");
    const prevBtn = carousel.querySelector("[data-carousel-prev]");
    const nextBtn = carousel.querySelector("[data-carousel-next]");
    const dotsWrap = carousel.querySelector("[data-carousel-dots]");
    if (!viewport || !track) return;
    const slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;

    carousel.classList.add("is-ready");
    track.style.touchAction = "pan-y";

    let index = 0;
    let maxScroll = 0;
    const clampX = () => (maxScroll = Math.max(0, track.scrollWidth - viewport.clientWidth));
    const posFor = (i) => Math.min(slides[i].offsetLeft, maxScroll);

    // Build dots
    const dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        dot.addEventListener("click", () => go(i, true));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    const render = () => {
      track.style.transform = "translateX(" + -posFor(index) + "px)";
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = posFor(index) >= maxScroll - 1;
    };
    function go(i, stop) {
      clampX();
      index = Math.max(0, Math.min(slides.length - 1, i));
      render();
      if (stop) pauseAuto();
    }
    const nextView = () => {
      clampX();
      if (posFor(index) >= maxScroll - 1) go(0);
      else go(index + 1);
    };

    if (prevBtn) prevBtn.addEventListener("click", () => go(index - 1, true));
    if (nextBtn) nextBtn.addEventListener("click", () => go(index + 1, true));

    // Keyboard on viewport
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1, true); }
    });

    // Pointer drag / swipe
    let dragging = false, startX = 0, startTx = 0;
    const onDown = (e) => {
      dragging = true;
      startX = e.clientX;
      startTx = -posFor(index);
      carousel.classList.add("is-dragging");
      track.setPointerCapture && track.setPointerCapture(e.pointerId);
      pauseAuto();
    };
    const onMove = (e) => {
      if (!dragging) return;
      track.style.transform = "translateX(" + (startTx + (e.clientX - startX)) + "px)";
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      carousel.classList.remove("is-dragging");
      const delta = e.clientX - startX;
      if (delta < -50) go(index + 1);
      else if (delta > 50) go(index - 1);
      else render();
    };
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);

    // Auto-advance (skip under reduced motion), pause on hover/focus
    let timer = null;
    const startAuto = () => {
      if (reduce || timer) return;
      timer = window.setInterval(nextView, 6000);
    };
    function pauseAuto() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    carousel.addEventListener("mouseenter", pauseAuto);
    carousel.addEventListener("mouseleave", startAuto);
    carousel.addEventListener("focusin", pauseAuto);
    carousel.addEventListener("focusout", startAuto);

    window.addEventListener("resize", () => { clampX(); render(); });
    clampX();
    render();
    startAuto();
  });

  /* =========================================================
     Graceful fallback: reduced motion OR libraries unavailable.
     Remove js-motion so all hidden states clear; show final numbers.
     ========================================================= */
  if (reduce || !hasGSAP) {
    root.classList.remove("js-motion");
    setCountersFinal();
    return;
  }

  /* =========================================================
     Full motion path
     ========================================================= */
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scrolling, synced to GSAP ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Smooth in-page anchor navigation ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.length < 2) return;
    a.addEventListener("click", (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Hero entrance timeline (cinematic) ---------- */
  const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
  tl.from(".hero__media", { opacity: 0, duration: 1.4, ease: "power2.out" }, 0)
    .fromTo(
      '[data-hero="eyebrow"]',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6 },
      0.3
    )
    .fromTo(
      ".hero__title .line",
      { yPercent: 122, filter: "blur(8px)" },
      { yPercent: 0, filter: "blur(0px)", duration: 1.15, stagger: 0.16, ease: "power4.out" },
      0.4
    )
    .fromTo(
      '[data-hero="lede"]',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0 },
      "-=0.6"
    )
    .fromTo(
      '[data-hero="actions"]',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7 },
      "-=0.7"
    )
    .fromTo(
      '[data-hero="badges"]',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7 },
      "-=0.5"
    );

  /* Soft pulsing coral glow in the hero */
  gsap.to(".hero__glow", {
    scale: 1.15,
    opacity: 0.75,
    duration: 3.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    transformOrigin: "center center",
  });

  /* ---------- Section-heading mask reveal ---------- */
  gsap.utils.toArray(".section__title").forEach((title) => {
    gsap.fromTo(
      title,
      { clipPath: "inset(0 0 108% 0)" },
      {
        clipPath: "inset(0 0 -8% 0)",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: title, start: "top 88%" },
      }
    );
  });

  /* ---------- Batched scroll reveals (everything except stats) ---------- */
  const revealTargets = gsap.utils.toArray(".reveal:not(.stat)");
  gsap.set(revealTargets, { opacity: 0, y: 34 });
  ScrollTrigger.batch(revealTargets, {
    start: "top 88%",
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power4.out",
        stagger: { each: 0.1, ease: "power1.out" },
        overwrite: true,
      }),
  });

  /* ---------- Stats: rule draw + blur/scale-in + count up ---------- */
  const runCounter = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = fmt(Math.round(obj.v));
      },
    });
  };

  ScrollTrigger.create({
    trigger: ".stats",
    start: "top 78%",
    once: true,
    onEnter: () => {
      gsap.to(".stats__rule", { scaleX: 1, duration: 1.2, ease: "power4.out" });
      gsap.fromTo(
        ".stat",
        { opacity: 0, y: 22, scale: 0.96, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.05,
          stagger: 0.13,
          ease: "power4.out",
        }
      );
      counters.forEach(runCounter);
    },
  });

  /* ---------- Portfolio marquee (two rows, opposite dirs, pause on hover) ---------- */
  gsap.utils.toArray(".marquee__row").forEach((row) => {
    const dir = parseFloat(row.dataset.marqueeRow) || 1; // -1 left, 1 right
    const from = dir < 0 ? 0 : -50;
    const to = dir < 0 ? -50 : 0;
    gsap.set(row, { xPercent: from });
    const tween = gsap.to(row, {
      xPercent: to,
      duration: 26,
      ease: "none",
      repeat: -1,
    });
    row.addEventListener("mouseenter", () =>
      gsap.to(tween, { timeScale: 0, duration: 0.4, overwrite: true })
    );
    row.addEventListener("mouseleave", () =>
      gsap.to(tween, { timeScale: 1, duration: 0.4, overwrite: true })
    );
  });

  /* ---------- Ticker strip: seamless loop (two identical groups) ---------- */
  const ticker = document.querySelector("[data-ticker]");
  if (ticker) {
    gsap.to(ticker, {
      xPercent: -50,
      duration: 32,
      ease: "none",
      repeat: -1,
    });
  }

  /* ---------- Hero scroll parallax: video scales/sinks, copy rises ---------- */
  gsap.fromTo(
    ".hero__video",
    { scale: 1, yPercent: 0, filter: "brightness(1)" },
    {
      scale: 1.22,
      yPercent: 14,
      filter: "brightness(0.5)",
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    }
  );
  gsap.to(".hero__inner", {
    yPercent: -22,
    opacity: 0.15,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to('[data-parallax="glow"]', {
    x: -30,
    y: 40,
    duration: 9,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });

  /* ---------- Cinematic real-image reveals + parallax ---------- */
  const aboutPhoto = document.querySelector(".about__photo");
  if (aboutPhoto) {
    gsap.fromTo(
      aboutPhoto,
      { clipPath: "inset(14% 14% 14% 14% round 24px)", scale: 1.08 },
      {
        clipPath: "inset(0% 0% 0% 0% round 24px)",
        scale: 1,
        duration: 1.25,
        ease: "power3.out",
        scrollTrigger: { trigger: aboutPhoto, start: "top 82%" },
      }
    );
  }

  const tsMedia = document.querySelector(".recognition__media");
  if (tsMedia) {
    gsap.fromTo(
      tsMedia,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 1.3,
        ease: "power3.out",
        scrollTrigger: { trigger: tsMedia, start: "top 84%" },
      }
    );
    gsap.fromTo(
      tsMedia.querySelector("img"),
      { yPercent: -6, scale: 1.14 },
      {
        yPercent: 6,
        scale: 1.06,
        ease: "none",
        scrollTrigger: { trigger: tsMedia, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  }

  /* ---------- Magnetic primary buttons (fine pointers only) ---------- */
  if (finePointer) {
    document.querySelectorAll(".btn--primary").forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
      btn.classList.add("is-magnetic");
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
      });
      btn.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------- Custom cursor (fine pointers only, graceful) ---------- */
  if (finePointer) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("cursor-hidden");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });

    let ready = false;
    window.addEventListener("mousemove", (e) => {
      if (!ready) {
        ready = true;
        document.body.classList.add("cursor-ready");
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    });
    window.addEventListener("mouseleave", () =>
      document.body.classList.remove("cursor-ready")
    );
    window.addEventListener("mouseenter", () => {
      if (ready) document.body.classList.add("cursor-ready");
    });

    document.querySelectorAll("a, button, .card, .chips li").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }

  /* ---------- Process: pinned horizontal scroll (wide screens only) ---------- */
  const processVp = document.querySelector("[data-process]");
  if (processVp) {
    const track = processVp.querySelector(".process__track");
    const mm = gsap.matchMedia();
    mm.add("(min-width: 800px)", () => {
      processVp.classList.add("is-horizontal");
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: processVp,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => {
        tween.scrollTrigger && tween.scrollTrigger.kill();
        tween.kill();
        processVp.classList.remove("is-horizontal");
        gsap.set(track, { clearProps: "transform" });
      };
    });
  }

  /* ---------- Interactive TiE timeline: highlight active entry ---------- */
  gsap.utils.toArray("[data-timeline-item]").forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: "top 62%",
      end: "bottom 42%",
      onToggle: (self) => item.classList.toggle("is-active", self.isActive),
    });
  });

  /* ---------- Hero cursor-follow glow (fine pointers) ---------- */
  if (finePointer) {
    const hero = document.querySelector(".hero");
    const glow = document.querySelector("[data-cursor-glow]");
    if (hero && glow) {
      const gx = gsap.quickTo(glow, "x", { duration: 0.6, ease: "power3" });
      const gy = gsap.quickTo(glow, "y", { duration: 0.6, ease: "power3" });
      hero.addEventListener("mouseenter", () => hero.classList.add("cursor-glow-on"));
      hero.addEventListener("mouseleave", () => hero.classList.remove("cursor-glow-on"));
      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        gx(e.clientX - r.left);
        gy(e.clientY - r.top);
      });
    }
  }

  /* ---------- Keep triggers honest after fonts/layout settle ---------- */
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
