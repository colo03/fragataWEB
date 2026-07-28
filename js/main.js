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

  /* -------------------- Perfil de obra: "Me interesa esta obra" -------------------- */
  const interestBtn = document.getElementById("interestBtn");
  const interestForm = document.getElementById("interestForm");

  if (interestBtn && interestForm) {
    const cta = interestBtn.closest(".artwork__cta");
    const formEl = document.getElementById("interestFormEl");
    const doneEl = document.getElementById("interestDone");
    const cancelBtn = document.getElementById("interestCancel");

    const openInterest = () => {
      interestForm.hidden = false;
      interestBtn.setAttribute("aria-expanded", "true");
      interestBtn.hidden = true; // el CTA se reemplaza por el formulario
      if (cta) cta.classList.add("is-open");
      const firstInput = interestForm.querySelector("input, textarea");
      if (firstInput) firstInput.focus();
    };

    const closeInterest = () => {
      interestForm.hidden = true;
      interestBtn.hidden = false;
      interestBtn.setAttribute("aria-expanded", "false");
      if (cta) cta.classList.remove("is-open");
      interestBtn.focus();
    };

    interestBtn.addEventListener("click", openInterest);
    if (cancelBtn) cancelBtn.addEventListener("click", closeInterest);

    if (formEl) {
      formEl.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!formEl.checkValidity()) {
          formEl.reportValidity();
          return;
        }
        // TODO: conectar con servicio real (Formspree / backend / email).
        formEl.hidden = true;
        if (doneEl) {
          doneEl.hidden = false;
          doneEl.focus?.();
        }
      });
    }
  }

  /* -------------------- Artistas: Búsqueda, filtro y orden -------------------- */
  const artistSearch = document.getElementById("artistSearch");
  const filterDiscipline = document.getElementById("filterDiscipline");
  const btnSortToggle = document.getElementById("btnSortToggle");
  const artistsGrid = document.getElementById("artistsGrid");
  const artistsEmpty = document.getElementById("artistsEmpty");
  const labelSort = document.getElementById("labelSort");

  // Solo ejecutar si estamos en una página con la grilla de artistas
  if (artistsGrid) {
    // Datos de ejemplo. En un caso real, vendrían de un backend/API.
    const artistsData = [
      { name: "Ana Pérez", discipline: "Pintura", artwork: "Serenidad Cósmica", photo: "placeholder" },
      { name: "Carlos Gómez", discipline: "Fotografía", artwork: "Reflejos Urbanos", photo: "placeholder" },
      { name: "Sofía Rossi", discipline: "Instalación", artwork: "Laberinto de Ecos", photo: "placeholder" },
      { name: "Javier Núñez", discipline: "Escultura", artwork: "Forma Fluida", photo: "placeholder" },
      { name: "Valentina Rojas", discipline: "Pintura", artwork: "Retrato del Viento", photo: "placeholder" },
      { name: "Mateo Díaz", discipline: "Fotografía", artwork: "Naturaleza Oculta", photo: "placeholder" },
      { name: "Lucía Fernández", discipline: "Instalación", artwork: "Diálogos de Luz", photo: "placeholder" },
      { name: "Diego Morales", discipline: "Escultura", artwork: "Tensión y Equilibrio", photo: "placeholder" },
    ];

    let currentSortOrder = "asc"; // 'asc' o 'desc'

    // Función para renderizar los artistas en la grilla
    const renderArtists = (artists) => {
      artistsGrid.innerHTML = ""; // Limpiar la grilla

      if (artists.length === 0) {
        artistsEmpty.style.display = "block";
      } else {
        artistsEmpty.style.display = "none";
      }

      artists.forEach((artist) => {
        const card = document.createElement("a");
        card.href = "#"; // TODO: Enlazar a perfil de artista
        card.className = "artist-card";
        card.innerHTML = `
          <div class="artist-card__photo" data-placeholder="Foto de ${artist.name}"></div>
          <div class="artist-card__body">
            <h3 class="artist-card__name">${artist.name}</h3>
            <p class="artist-card__disc">${artist.discipline}</p>
            <p class="artist-card__artwork">Obra: "${artist.artwork}"</p>
          </div>
        `;
        // Para la animación de entrada
        card.classList.add("is-visible");
        artistsGrid.appendChild(card);
      });
    };

    // Función principal para filtrar y ordenar
    const updateView = () => {
      const searchTerm = artistSearch.value.toLowerCase();
      const selectedDiscipline = filterDiscipline.value;

      let filteredArtists = artistsData.filter((artist) => {
        const matchesSearch =
          artist.name.toLowerCase().includes(searchTerm) ||
          artist.discipline.toLowerCase().includes(searchTerm) ||
          artist.artwork.toLowerCase().includes(searchTerm);

        const matchesDiscipline =
          selectedDiscipline === "all" || artist.discipline === selectedDiscipline;

        return matchesSearch && matchesDiscipline;
      });

      // Ordenar
      filteredArtists.sort((a, b) => {
        if (currentSortOrder === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });

      renderArtists(filteredArtists);
    };

    // Event Listeners
    artistSearch.addEventListener("input", updateView);
    filterDiscipline.addEventListener("change", updateView);

    btnSortToggle.addEventListener("click", () => {
      currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      
      // Actualizar UI del botón
      const icon = btnSortToggle.querySelector(".icon");
      if (labelSort && icon) {
        if (currentSortOrder === "asc") {
          labelSort.textContent = "Artista: A - Z";
          icon.textContent = "↓";
        } else {
          labelSort.textContent = "Artista: Z - A";
          icon.textContent = "↑";
        }
      }
      
      updateView();
    });

    // Renderizado inicial
    updateView();
  }

  // Eliminar las tarjetas hardcodeadas del HTML para evitar duplicados
  const staticArtistGrid = document.querySelector('.artists__grid:not([id="artistsGrid"])');
  if (staticArtistGrid) {
    staticArtistGrid.remove();
  }

  // Asegurarse de que solo haya una grilla de artistas
  const allGrids = document.querySelectorAll("#artistsGrid");
  if (allGrids.length > 1) {
    for (let i = 1; i < allGrids.length; i++) {
      allGrids[i].remove();
    }
  }

})();
