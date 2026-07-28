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

/* -------------------- Módulo Buscador de Artistas -------------------- */
const artistsData = [
  {
    id: 1,
    nombre: "Lucía Marenco",
    disciplina: "Pintura",
    tecnica: "Óleo sobre lienzo",
    obraDestacada: "Nocturno #4",
    foto: "Foto del artista",
    link: "#"
  },
  {
    id: 2,
    nombre: "Marcos Del Castillo",
    disciplina: "Fotografía",
    tecnica: "Analógica 35mm",
    obraDestacada: "Luces errantes",
    foto: "Foto del artista",
    link: "#"
  },
  {
    id: 3,
    nombre: "Elena Rostova",
    disciplina: "Instalación",
    tecnica: "Escultura lumínica / Neón",
    obraDestacada: "Fragmentos de sombra",
    foto: "Foto del artista",
    link: "#"
  },
  {
    id: 4,
    nombre: "Ariel Cohen",
    disciplina: "Escultura",
    tecnica: "Metal forjado",
    obraDestacada: "Estructura I",
    foto: "Foto del artista",
    link: "#"
  }
];

const grid = document.getElementById("artistsGrid");
const searchInput = document.getElementById("artistSearch");
const disciplineSelect = document.getElementById("filterDiscipline");
const btnSortToggle = document.getElementById("btnSortToggle");
const labelSort = document.getElementById("labelSort");
const emptyMsg = document.getElementById("artistsEmpty");

// Estados de ordenamiento para el botón alternante (Toggle)
const sortModes = [
  { id: "name-asc", label: "Artista: A - Z", icon: "↓" },
  { id: "name-desc", label: "Artista: Z - A", icon: "↑" },
  { id: "artwork-asc", label: "Obra: A - Z", icon: "↓" }
];
let currentSortIndex = 0;

function renderArtists(list) {
  if (!grid) return;
  grid.innerHTML = "";

  if (list.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  list.forEach((artist) => {
    const card = document.createElement("a");
    card.href = artist.link;
    card.className = "artist-card";

    card.innerHTML = `
      <div class="artist-card__photo" data-placeholder="${artist.foto}"></div>
      <div class="artist-card__body">
        <h3 class="artist-card__name">${artist.nombre}</h3>
        <p class="artist-card__disc">${artist.disciplina} — ${artist.tecnica}</p>
        <p class="artist-card__artwork">"${artist.obraDestacada}"</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterAndSort() {
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase().trim();
  const discipline = disciplineSelect.value;
  const sortBy = sortModes[currentSortIndex].id;

  // 1. Filtrar (Búsqueda general + Disciplina)
  let filtered = artistsData.filter((a) => {
    const matchesSearch =
      a.nombre.toLowerCase().includes(query) ||
      a.disciplina.toLowerCase().includes(query) ||
      a.tecnica.toLowerCase().includes(query) ||
      a.obraDestacada.toLowerCase().includes(query);

    const matchesDiscipline = discipline === "all" || a.disciplina === discipline;

    return matchesSearch && matchesDiscipline;
  });

  // 2. Ordenar
  filtered.sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.nombre.localeCompare(b.nombre);
    } else if (sortBy === "name-desc") {
      return b.nombre.localeCompare(a.nombre);
    } else if (sortBy === "artwork-asc") {
      return a.obraDestacada.localeCompare(b.obraDestacada);
    }
    return 0;
  });

  // 3. Renderizar
  renderArtists(filtered);
}

// Escuchar evento de clic en el botón toggle de orden
if (btnSortToggle) {
  btnSortToggle.addEventListener("click", () => {
    currentSortIndex = (currentSortIndex + 1) % sortModes.length;
    
    // Actualizar interfaz del botón
    labelSort.textContent = sortModes[currentSortIndex].label;
    btnSortToggle.querySelector(".icon").textContent = sortModes[currentSortIndex].icon;

    filterAndSort();
  });
}

if (searchInput && grid) {
  // Event listeners
  searchInput.addEventListener("input", filterAndSort);
  disciplineSelect.addEventListener("change", filterAndSort);

  // Carga inicial
  filterAndSort();
}
})();
