/* =====================================================================
   GALERÍA FRAGATA — main.js
   Interacciones de la landing (vanilla JS, sin dependencias).
   ===================================================================== */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -------------------- Preloader -------------------- */
  const preloader = document.getElementById("preloader");
  window.addEventListener("load", () => {
    if (preloader) {
      setTimeout(() => preloader.classList.add("is-done"), 350);
    }
  });

  /* -------------------- Año dinámico en footer -------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------- Navbar: fondo al hacer scroll -------------------- */
  const nav = document.getElementById("nav");
  const onScrollNav = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* -------------------- Menú mobile -------------------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const closeMenu = () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menú");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    // Cerrar al clickear un link
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeMenu)
    );
    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu();
    });
  }

  /* -------------------- Reveal on scroll -------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* -------------------- Scrollspy: link activo del nav -------------------- */
  const sections = document.querySelectorAll("main section[id]");
  const linkMap = new Map();
  document.querySelectorAll(".nav__link").forEach((link) => {
    const id = link.getAttribute("href");
    if (id && id.startsWith("#")) linkMap.set(id.slice(1), link);
  });

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            linkMap.forEach((l) => l.classList.remove("is-active"));
            const active = linkMap.get(entry.target.id);
            if (active) active.classList.add("is-active");
          }
        });
      },
      { threshold: 0.5, rootMargin: `-${80}px 0px -40% 0px` }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* -------------------- Parallax suave (bandera del hero) -------------------- */
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !prefersReduced) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = `translateY(calc(-50% + ${y * speed}px))`;
      });
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* -------------------- Form de newsletter (demo) -------------------- */
  const form = document.querySelector(".contact__form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const btn = form.querySelector("button");
      if (input && input.value) {
        // TODO: conectar con servicio real (Formspree / backend / Mailchimp).
        btn.textContent = "¡Listo! ✓";
        input.value = "";
        setTimeout(() => (btn.textContent = "Quiero enterarme"), 2500);
      }
    });
  }
})();
