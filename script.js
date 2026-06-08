const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector("[data-header]");
const progress = document.querySelector(".page-progress");
const cursorLight = document.querySelector(".cursor-light");

function updateChrome() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progressValue = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  if (progress) {
    progress.style.transform = `scaleX(${progressValue})`;
  }

  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
}

updateChrome();
window.addEventListener("scroll", updateChrome, { passive: true });

const scrollStories = document.querySelectorAll("[data-scroll-story]");

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function updateScrollStories() {
  scrollStories.forEach((story) => {
    const rect = story.getBoundingClientRect();
    const scrollDistance = Math.max(rect.height - window.innerHeight, 1);
    const progress = prefersReducedMotion
      ? 1
      : clamp(-rect.top / scrollDistance, 0, 1);
    const items = [...story.querySelectorAll("[data-scroll-item]")];

    story.style.setProperty("--story-progress", progress.toFixed(3));

    items.forEach((item, index) => {
      const threshold = 0.14 + index * 0.18;
      const pastThreshold = threshold + 0.16;
      const isPast = progress >= pastThreshold;
      const isActive = progress >= threshold && !isPast;

      item.classList.toggle("is-active", prefersReducedMotion || isActive);
      item.classList.toggle("is-past", !prefersReducedMotion && isPast);
    });
  });
}

if (scrollStories.length) {
  updateScrollStories();
  window.addEventListener("scroll", updateScrollStories, { passive: true });
  window.addEventListener("resize", updateScrollStories, { passive: true });
}

const serviceStories = document.querySelectorAll("[data-service-story]");

function updateServiceStories() {
  serviceStories.forEach((story) => {
    const stage = story.querySelector("[data-service-stage]");
    const cards = [...story.querySelectorAll("[data-service-card]")];

    if (!stage || !cards.length) {
      return;
    }

    stage.classList.add("is-activated");

    const rect = story.getBoundingClientRect();
    const scrollDistance = Math.max(rect.height - window.innerHeight, 1);
    const storyProgress = prefersReducedMotion
      ? 1
      : clamp(-rect.top / scrollDistance, 0, 1);
    const segmentSize = 1 / cards.length;
    const activeIndex = Math.min(
      cards.length - 1,
      Math.max(0, Math.floor(storyProgress / segmentSize))
    );
    const activeAccent =
      cards[activeIndex].style.getPropertyValue("--accent") || "#918EF4";

    stage.style.setProperty("--service-progress", storyProgress.toFixed(3));
    stage.style.setProperty("--active-accent", activeAccent.trim());

    cards.forEach((card, index) => {
      const localProgress = clamp(
        (storyProgress - index * segmentSize) / segmentSize,
        0,
        1
      );
      const isActive = prefersReducedMotion || index === activeIndex;
      const isPast = !prefersReducedMotion && index < activeIndex;

      card.style.setProperty("--service-local-progress", localProgress.toFixed(3));
      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-past", isPast);
    });
  });
}

if (serviceStories.length) {
  updateServiceStories();
  window.addEventListener("scroll", updateServiceStories, { passive: true });
  window.addEventListener("resize", updateServiceStories, { passive: true });
}

const clientStories = document.querySelectorAll("[data-client-story]");

function updateClientStories() {
  clientStories.forEach((story) => {
    const stage = story.querySelector("[data-client-stage]");
    const cards = [...story.querySelectorAll("[data-client-card]")];

    if (!stage || !cards.length) {
      return;
    }

    stage.classList.add("is-activated");

    const rect = story.getBoundingClientRect();
    const scrollDistance = Math.max(rect.height - window.innerHeight, 1);
    const storyProgress = prefersReducedMotion
      ? 1
      : clamp(-rect.top / scrollDistance, 0, 1);
    const segmentSize = 1 / cards.length;
    const activeIndex = Math.min(
      cards.length - 1,
      Math.max(0, Math.floor(storyProgress / segmentSize))
    );

    cards.forEach((card, index) => {
      const localProgress = clamp(
        (storyProgress - index * segmentSize) / segmentSize,
        0,
        1
      );
      const isActive = prefersReducedMotion || index === activeIndex;
      const isPast = !prefersReducedMotion && index < activeIndex;
      const imageVisible = prefersReducedMotion || (isActive && localProgress > 0.38);

      card.style.setProperty("--client-progress", localProgress.toFixed(3));
      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-past", isPast);
      card.classList.toggle("is-image-visible", imageVisible);
    });
  });
}

if (clientStories.length) {
  updateClientStories();
  window.addEventListener("scroll", updateClientStories, { passive: true });
  window.addEventListener("resize", updateClientStories, { passive: true });
}

if (cursorLight && !prefersReducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      cursorLight.style.opacity = "1";
      cursorLight.style.left = `${event.clientX}px`;
      cursorLight.style.top = `${event.clientY}px`;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    cursorLight.style.opacity = "0";
  });
}

const revealItems = document.querySelectorAll(".reveal-up");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const siblings = [...entry.target.parentElement.querySelectorAll(".reveal-up")];
      const index = Math.max(0, siblings.indexOf(entry.target));
      entry.target.style.setProperty("--delay", `${Math.min(index * 80, 360)}ms`);
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealItems.forEach((item) => {
  if (prefersReducedMotion) {
    item.classList.add("is-visible");
  } else {
    revealObserver.observe(item);
  }
});

const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const element = entry.target;
      const target = Number(element.dataset.count);
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        element.textContent = Math.round(target * eased).toLocaleString();

        if (elapsed < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
      counterObserver.unobserve(element);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => {
  if (prefersReducedMotion) {
    counter.textContent = Number(counter.dataset.count).toLocaleString();
  } else {
    counterObserver.observe(counter);
  }
});

document.querySelectorAll("[data-tilt]").forEach((card) => {
  if (prefersReducedMotion) {
    return;
  }

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty("--ry", `${x * 7}deg`);
    card.style.setProperty("--rx", `${y * -7}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });
});

function initHeroCanvas() {
  const canvas = document.querySelector("[data-hero-canvas]");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const colors = ["#004BA8", "#918EF4", "#DB5461", "#F2F3AE"];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let pointerX = 0.66;
  let pointerY = 0.36;

  const nodes = Array.from({ length: 42 }, (_, index) => ({
    x: (index * 0.137) % 1,
    y: (index * 0.241) % 1,
    speed: 0.00042 + (index % 5) * 0.00008,
    radius: 1.6 + (index % 4) * 0.8,
    color: colors[index % colors.length],
  }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawField(time) {
    ctx.clearRect(0, 0, width, height);

    const horizon = height * 0.62;
    const scrollInfluence = Math.min(window.scrollY / Math.max(height, 1), 1);

    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 14; i += 1) {
      const y = horizon + i * 42 + scrollInfluence * 42;
      ctx.beginPath();
      ctx.moveTo(width * -0.1, y);
      ctx.lineTo(width * 1.1, y - i * 19);
      ctx.stroke();
    }

    for (let i = 0; i < 12; i += 1) {
      const x = width * (i / 11);
      ctx.beginPath();
      ctx.moveTo(width * 0.5, horizon - 60);
      ctx.lineTo(x, height * 1.06);
      ctx.stroke();
    }
    ctx.restore();

    const centerX = width * (0.5 + (pointerX - 0.5) * 0.06);
    const centerY = height * (0.42 + (pointerY - 0.5) * 0.05);

    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = "rgba(242,243,174,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width * 0.18, height * 0.11, -0.08, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(145,142,244,0.56)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width * 0.32, height * 0.19, 0.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    nodes.forEach((node, index) => {
      const drift = time * node.speed + index;
      const x = ((node.x + Math.sin(drift) * 0.018 + scrollInfluence * 0.06) % 1) * width;
      const y = (node.y + Math.cos(drift * 0.8) * 0.025) * height;
      const linked = nodes[(index + 9) % nodes.length];
      const linkedX = ((linked.x + Math.sin(time * linked.speed + index) * 0.018) % 1) * width;
      const linkedY = (linked.y + Math.cos(time * linked.speed * 0.8) * 0.025) * height;

      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = node.color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(linkedX, linkedY);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const pulse = 0.5 + Math.sin(time * 0.002) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.16 + pulse * 0.08;
    ctx.fillStyle = "#F2F3AE";
    ctx.fillRect(width * 0.08, height * 0.78, width * 0.44, 2);
    ctx.fillRect(width * 0.18, height * 0.82, width * 0.56, 2);
    ctx.fillRect(width * 0.28, height * 0.86, width * 0.5, 2);
    ctx.restore();
  }

  function animate(time) {
    drawField(time);
    rafId = requestAnimationFrame(animate);
  }

  resize();

  if (prefersReducedMotion) {
    drawField(0);
  } else {
    rafId = requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX / window.innerWidth;
      pointerY = event.clientY / window.innerHeight;
    },
    { passive: true }
  );

  window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
}

initHeroCanvas();

// Kinetic reveal for the Contact CTA headline (mirrors the original design).
(function () {
  const cta = document.querySelector(".cta");
  if (!cta) return;
  if (prefersReducedMotion) {
    cta.classList.add("in");
    return;
  }
  const ctaObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          cta.classList.add("in");
          ctaObserver.unobserve(cta);
        }
      });
    },
    { threshold: 0.3 }
  );
  ctaObserver.observe(cta);
})();
