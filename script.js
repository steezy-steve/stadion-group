(() => {
  "use strict";

  const docEl = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sda = docEl.classList.contains("sda");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /* ------------------------------ header chrome ------------------------------ */

  const header = document.querySelector("[data-header]");

  function updateHeader() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* Scroll spy: highlight the nav link for the section in view. */
  const spyLinks = new Map(
    [...document.querySelectorAll("[data-spy]")].map((link) => [link.dataset.spy, link])
  );

  if (spyLinks.size) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = spyLinks.get(entry.target.id);
          if (link) {
            link.classList.toggle("is-current", entry.isIntersecting);
          }
        });
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );

    ["services", "clients", "contact"].forEach((id) => {
      const section = document.getElementById(id);
      if (section && spyLinks.has(id)) {
        spyObserver.observe(section);
      }
    });
  }

  /* ------------------------- mandate word splitter --------------------------
     Wraps each word of the statement in a span and hands it a personal slice
     of the section's scroll timeline, so the sentence fills word-by-word. */

  if (sda && !reduced) {
    const statement = document.querySelector("[data-words]");

    if (statement) {
      const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      const words = [];
      textNodes.forEach((node) => {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) {
            return;
          }
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            frag.appendChild(span);
            words.push(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });

      const rangeStart = 4;
      const rangeEnd = 62;
      const windowSize = 15;
      const step = words.length > 1 ? (rangeEnd - windowSize - rangeStart) / (words.length - 1) : 0;

      words.forEach((span, index) => {
        const start = rangeStart + index * step;
        span.style.animationRange = `contain ${start.toFixed(2)}% contain ${(start + windowSize).toFixed(2)}%`;
      });
    }
  }

  /* ------------------------- pointer-driven garnish --------------------------
     One rAF loop lerps the cursor light, the tunnel steering, and the
     scroll-velocity skew on the ticker. */

  if (!reduced) {
    const cursorLight = finePointer ? document.querySelector(".cursor-light") : null;
    const tunnelStage = document.querySelector(".tunnel-stage");
    const tickerStage = document.querySelector("[data-ticker]");

    let tunnelVisible = false;
    let tickerVisible = false;

    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === tunnelStage) {
          tunnelVisible = entry.isIntersecting;
        }
        if (entry.target === tickerStage) {
          tickerVisible = entry.isIntersecting;
        }
      });
    });

    if (tunnelStage) visibilityObserver.observe(tunnelStage);
    if (tickerStage) visibilityObserver.observe(tickerStage);

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let lightX = pointerX;
    let lightY = pointerY;
    let lightShown = false;
    let steerX = 0;
    let steerY = 0;
    let skew = 0;
    let lastScrollY = window.scrollY;

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (cursorLight && !lightShown) {
          lightShown = true;
          cursorLight.style.opacity = "1";
        }
      },
      { passive: true }
    );

    window.addEventListener("pointerleave", () => {
      if (cursorLight) {
        lightShown = false;
        cursorLight.style.opacity = "0";
      }
    });

    function motionLoop() {
      if (cursorLight && lightShown) {
        const prevX = lightX;
        const prevY = lightY;
        lightX += (pointerX - lightX) * 0.16;
        lightY += (pointerY - lightY) * 0.16;
        const speed = Math.hypot(lightX - prevX, lightY - prevY);
        const scale = 1 + Math.min(speed / 60, 0.55);
        cursorLight.style.left = `${lightX.toFixed(1)}px`;
        cursorLight.style.top = `${lightY.toFixed(1)}px`;
        cursorLight.style.transform = `translate3d(-50%, -50%, 0) scale(${scale.toFixed(3)})`;
      }

      if (tunnelStage && tunnelVisible) {
        const nx = (pointerX / window.innerWidth - 0.5) * 2;
        const ny = (pointerY / window.innerHeight - 0.5) * 2;
        steerX += (nx * 90 - steerX) * 0.06;
        steerY += (ny * 60 - steerY) * 0.06;
        tunnelStage.style.setProperty("--steer-x", `${steerX.toFixed(1)}px`);
        tunnelStage.style.setProperty("--steer-y", `${steerY.toFixed(1)}px`);
      }

      const y = window.scrollY;
      if (tickerStage && tickerVisible) {
        const velocity = y - lastScrollY;
        const target = clamp(velocity * 0.35, -8, 8);
        skew += (target - skew) * 0.12;
        tickerStage.style.setProperty("--skew", `${skew.toFixed(2)}deg`);
      }
      lastScrollY = y;

      requestAnimationFrame(motionLoop);
    }

    requestAnimationFrame(motionLoop);
  }

  /* --------------------------- no-sda fallback engine ------------------------
     For browsers without scroll-driven animations: class toggles and progress
     custom properties recreate the journey with transitions. */

  if (!sda && !reduced) {
    const progressBar = document.querySelector(".page-progress");
    const clockNum = document.querySelector(".hud-clock-num");
    const serviceStory = document.querySelector(".services");
    const serviceStage = document.querySelector("[data-service-stage]");
    const serviceCards = [...document.querySelectorAll("[data-service-card]")];

    let scrollScheduled = false;

    function updateServiceDeck() {
      if (!serviceStory || !serviceStage || !serviceCards.length) {
        return;
      }

      serviceStage.classList.add("is-activated");

      const rect = serviceStory.getBoundingClientRect();
      const scrollDistance = Math.max(rect.height - window.innerHeight, 1);
      const storyProgress = clamp(-rect.top / scrollDistance, 0, 1);
      const segmentSize = 1 / serviceCards.length;
      const activeIndex = Math.min(
        serviceCards.length - 1,
        Math.max(0, Math.floor(storyProgress / segmentSize))
      );

      serviceStage.style.setProperty("--service-progress", storyProgress.toFixed(3));

      serviceCards.forEach((card, index) => {
        card.classList.toggle("is-active", index === activeIndex);
        card.classList.toggle("is-past", index < activeIndex);
      });
    }

    function onScroll() {
      if (scrollScheduled) {
        return;
      }
      scrollScheduled = true;

      requestAnimationFrame(() => {
        scrollScheduled = false;

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const pageProgress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;

        if (progressBar) {
          progressBar.style.transform = `scaleX(${pageProgress.toFixed(4)})`;
        }
        if (clockNum) {
          clockNum.textContent = `${String(Math.round(pageProgress * 90)).padStart(2, "0")}'`;
        }

        updateServiceDeck();
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    /* Hide the CSS-counter pseudo content; JS owns the clock text here. */
    if (clockNum) {
      clockNum.classList.add("js-clock");
      clockNum.textContent = "00'";
    }

    /* Tunnel build-in. */
    const tunnelStage = document.querySelector(".tunnel-stage");
    if (tunnelStage) {
      const tunnelObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              tunnelStage.classList.add("in");
              tunnelObserver.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      tunnelObserver.observe(tunnelStage);
    }

    /* Mandate stats: reveal + count up. */
    function animateCount(el, target) {
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (elapsed < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    }

    const stats = [...document.querySelectorAll(".stat[data-count]")];
    if (stats.length) {
      const statObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            const stat = entry.target;
            stat.classList.add("is-active");
            const real = stat.querySelector(".stat-real");
            if (real) {
              animateCount(real, Number(stat.dataset.count));
            }
            statObserver.unobserve(stat);
          });
        },
        { threshold: 0.5 }
      );
      stats.forEach((stat) => statObserver.observe(stat));
    }

    /* CTA headline. */
    const cta = document.querySelector(".cta");
    if (cta) {
      const ctaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              cta.classList.add("in");
              ctaObserver.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      ctaObserver.observe(cta);
    }

    /* Generic rise-in reveals: marked elements, roster panels, ticker quote. */
    const revealTargets = [
      ...document.querySelectorAll("[data-reveal]"),
      ...document.querySelectorAll(".roster-panel"),
    ];
    revealTargets.forEach((el) => el.classList.add("reveal-up"));

    const quote = document.querySelector(".tk-quote");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const el = entry.target;
          if (el.classList.contains("reveal-up")) {
            const siblings = [...el.parentElement.querySelectorAll(".reveal-up")];
            const index = Math.max(0, siblings.indexOf(el));
            el.style.setProperty("--delay", `${Math.min(index * 80, 360)}ms`);
          }
          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
    if (quote) {
      revealObserver.observe(quote);
    }
  }

  /* Reduced motion: make sure stat numbers read their final values. */
  if (reduced) {
    document.querySelectorAll(".stat[data-count] .stat-real").forEach((el) => {
      el.textContent = Number(el.closest(".stat").dataset.count).toLocaleString();
    });
  }
})();
