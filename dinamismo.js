document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const progress = document.createElement("div");
  progress.id = "progreso-lectura";
  document.body.prepend(progress);

  const topButton = document.createElement("button");
  topButton.id = "volver-arriba";
  topButton.type = "button";
  topButton.setAttribute("aria-label", "Volver arriba");
  topButton.textContent = "?";
  document.body.appendChild(topButton);

  const revealTargets = document.querySelectorAll(
    ".hero, .page-hero, .section, .hero-panel, .card, .quote, .timeline-item, .survey, .video-card, .gallery-item, .section-card, .form-card, .info-table, .metric, .step, .action, .counter, .stat-table"
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.transitionDelay = `${Math.min(index * 32, 240)}ms`;
    observer.observe(element);
  });

  const updateProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progress.style.width = `${Math.min(percent, 100)}%`;
    topButton.classList.toggle("visible", window.scrollY > 420);
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll("[data-tabs]").forEach((tabs) => {
    const buttons = Array.from(tabs.querySelectorAll("[data-tab-button]"));
    const panels = Array.from(tabs.querySelectorAll("[data-tab-panel]"));

    const activate = (targetId) => {
      buttons.forEach((button) => {
        const active = button.getAttribute("data-tab-target") === targetId;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => {
        const active = panel.id === targetId;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        activate(button.getAttribute("data-tab-target") || "");
      });
    });

    const initial = buttons.find((button) => button.classList.contains("is-active"));
    activate((initial && initial.getAttribute("data-tab-target")) || panels[0]?.id || "");
  });

  document.querySelectorAll("[data-survey]").forEach((survey) => {
    const key = survey.getAttribute("data-survey") || "default";
    const feedback = survey.querySelector("[data-survey-feedback]");
    const buttons = survey.querySelectorAll("[data-survey-option]");
    const saved = localStorage.getItem(`survey:${key}`);

    if (saved && feedback) {
      feedback.textContent = saved;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");

        const message = button.getAttribute("data-survey-message") || button.textContent.trim();
        const extra = button.getAttribute("data-survey-extra");
        const finalMessage = extra ? `${message}. ${extra}` : message;

        if (feedback) feedback.textContent = finalMessage;
        localStorage.setItem(`survey:${key}`, finalMessage);
      });
    });
  });

  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = Number(el.getAttribute("data-counter")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    let start = null;

    const animate = (time) => {
      if (start === null) start = time;
      const progressValue = Math.min((time - start) / 1100, 1);
      const value = Math.floor(progressValue * target);
      el.textContent = `${value}${suffix}`;
      if (progressValue < 1) requestAnimationFrame(animate);
    };

    observer.observe(el.closest(".counter, .metric") || el);
    requestAnimationFrame(animate);
  });

  document.querySelectorAll("[data-bar]").forEach((bar) => {
    const value = bar.getAttribute("data-bar");
    if (value) {
      bar.style.setProperty("--value", value);
    }
  });

  const forumForm = document.querySelector("[data-forum-form]");
  const forumList = document.querySelector("[data-forum-list]");

  if (forumForm && forumList) {
    forumForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(forumForm);
      const name = String(formData.get("nombre") || "").trim();
      const topic = String(formData.get("tema") || "").trim();
      const message = String(formData.get("mensaje") || "").trim();

      if (!name || !message) {
        alert("Completa tu nombre y tu reflexi�n para poder publicarla.");
        return;
      }

      const article = document.createElement("article");
      article.className = "card comment";
      article.innerHTML = `
        <div class="meta">
          <span class="name"></span>
          <span class="topic"></span>
        </div>
        <p></p>
      `;
      article.querySelector(".name").textContent = name;
      article.querySelector(".topic").textContent = topic;
      article.querySelector("p").textContent = message;

      forumList.prepend(article);
      forumForm.reset();
      observer.observe(article);
    });
  }

  let lightbox = null;

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
  };

  const ensureLightbox = () => {
    if (lightbox) return lightbox;

    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <div class="lightbox-inner">
        <button class="lightbox-close" type="button" aria-label="Cerrar vista ampliada">�</button>
        <img alt="" />
      </div>
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox || event.target.classList.contains("lightbox-close")) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox && !lightbox.hidden) {
        closeLightbox();
      }
    });

    return lightbox;
  };

  document.querySelectorAll("[data-gallery-lightbox]").forEach((item) => {
    item.addEventListener("click", () => {
      const src = item.getAttribute("data-gallery-lightbox");
      if (!src) return;

      const modal = ensureLightbox();
      const img = modal.querySelector("img");
      img.src = src;
      img.alt = item.querySelector("img")?.alt || "Imagen ampliada";
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  const ambient = document.createElement("div");
  ambient.className = "ambient-scene";
  ambient.setAttribute("aria-hidden", "true");
  const types = ["orb", "bean", "cup", "steam"];
  const count = window.innerWidth < 900 ? 7 : 11;

  for (let index = 0; index < count; index += 1) {
    const item = document.createElement("span");
    const type = types[index % types.length];
    const size = type === "steam" ? 72 + Math.random() * 60 : 28 + Math.random() * 86;
    item.className = `ambient-object ${type}`;
    item.style.setProperty("--x", `${Math.random() * 100}vw`);
    item.style.setProperty("--y", `${Math.random() * 100}vh`);
    item.style.setProperty("--size", `${size}px`);
    item.style.setProperty("--opacity", type === "orb" ? `${0.12 + Math.random() * 0.1}` : `${0.16 + Math.random() * 0.12}`);
    item.style.setProperty("--rotate", `${-20 + Math.random() * 40}deg`);
    item.style.setProperty("--duration", `${12 + Math.random() * 14}s`);
    item.style.setProperty("--delay", `${Math.random() * -12}s`);
    item.style.setProperty("--dx", `${-22 + Math.random() * 44}px`);
    item.style.setProperty("--dy", `${-24 + Math.random() * 48}px`);
    ambient.appendChild(item);
  }

  document.body.prepend(ambient);
});
