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
    // Los datos viven en js/data.js, que también alimenta artista.html.
    const { escape: esc, media } = window.FRAGATA;
    const artistsData = window.FRAGATA_ARTISTS || [];

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
        card.href = `artista.html?slug=${encodeURIComponent(artist.slug)}`;
        card.className = "artist-card";
        // Se muestra la primera obra de la lista como obra destacada.
        const featured = artist.works[0];
        card.innerHTML = `
          ${media(artist.photo, `Retrato de ${artist.name}`, "artist-card__photo", `Foto de ${artist.name}`)}
          <div class="artist-card__body">
            <h3 class="artist-card__name">${esc(artist.name)}</h3>
            <p class="artist-card__disc">${esc(artist.discipline)}</p>
            ${featured ? `<p class="artist-card__artwork">Obra: "${esc(featured.title)}"</p>` : ""}
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
        // Busca en nombre, disciplina y en el título/técnica de TODAS las
        // obras del artista, no sólo en la destacada.
        const haystack = [
          artist.name,
          artist.discipline,
          ...artist.works.flatMap((w) => [w.title, w.technique]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = haystack.includes(searchTerm);

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

/* =====================================================================
   GALERÍA FRAGATA — artistas.js
   ===================================================================== */

(function () {
  "use strict";

  if (!window.FRAGATA || !window.FRAGATA_ARTISTS) return;

  const { escape: e, media, workUrl } = window.FRAGATA;
  const artists = window.FRAGATA_ARTISTS;

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -------------------- Agrupar obras por disciplina -------------------- */
  const GROUPS = {
    pintura: ["Pintura"],
    fotografia: ["Fotografía"],
    "instalacion-escultura": ["Instalación", "Escultura"],
    performance: ["Performance"],
  };

  const worksByGroup = (disciplines) => {
    const out = [];
    artists.forEach((artist) => {
      if (!disciplines.includes(artist.discipline)) return;
      (artist.works || []).forEach((work) => {
        out.push({ work, artist });
      });
    });
    return out;
  };

  /* -------------------- Tarjeta de obra para el carrusel -------------------- */
  const marqueeCard = ({ work, artist }, cloneIndex) => {
    const hiddenAttrs =
      cloneIndex === 0 ? "" : ' aria-hidden="true" tabindex="-1"';
    return `
      <li class="marquee__item"${cloneIndex === 0 ? "" : ' aria-hidden="true"'}>
        <a class="marquee-card" href="${e(workUrl(work, artist))}" draggable="false"${hiddenAttrs}>
          <div class="marquee-card__media">
            ${media(
              work.photo,
              `${work.title}, de ${artist.name}`,
              "marquee-card__photo",
              "Foto de la obra"
            )}
          </div>
          <div class="marquee-card__body">
            <p class="marquee-card__artist">${e(artist.name)}</p>
            <h4 class="marquee-card__title">${e(work.title)}</h4>
            ${work.year ? `<p class="marquee-card__disc">${e(work.year)}</p>` : ""}
          </div>
        </a>
      </li>`;
  };

  /* -------------------- Poblar cada fila -------------------- */
  document.querySelectorAll("[data-marquee]").forEach((el) => {
    const groupKey = el.dataset.marqueeGroup;
    const disciplines = GROUPS[groupKey];
    const track = el.querySelector("[data-marquee-track]");
    const row = el.closest(".disc-showcase__row");
    if (!disciplines || !track) return;

    const items = worksByGroup(disciplines);

    if (!items.length) {
      if (row) row.hidden = true;
      return;
    }

    const copies = [0, 1, 2];
    track.innerHTML = copies
      .map((copyIndex) =>
        items.map((item) => marqueeCard(item, copyIndex)).join("")
      )
      .join("");

    initMarquee(el, track);
  });

  /* -------------------- Motor de scroll continuo -------------------- */
  function initMarquee(viewport, track) {
    const direction = viewport.dataset.direction === "left" ? -1 : 1;
    const SPEED = 0.5; // px por frame a 60fps ≈ 30px/s

    let singleWidth = 0;
    let hoverPaused = false;
    let offscreenPaused = !prefersReduced ? false : true;
    let isDragging = false;
    let pointerDown = false;
    let suppressClick = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let rafId = null;

    // Menos que esto es un click, no un arrastre: si no, el pointer capture
    // se queda con el evento y la tarjeta nunca navega a la obra.
    const DRAG_THRESHOLD = 5;

    const measure = () => {
      singleWidth = track.scrollWidth / 3;
      if (viewport.scrollLeft < 1) {
        viewport.scrollLeft = singleWidth;
      }
    };

    const wrapIfNeeded = () => {
      if (viewport.scrollLeft <= 1) {
        viewport.scrollLeft += singleWidth;
      } else if (viewport.scrollLeft >= singleWidth * 2 - 1) {
        viewport.scrollLeft -= singleWidth;
      }
    };

    const tick = () => {
      const paused = hoverPaused || offscreenPaused || isDragging;
      if (!paused) {
        viewport.scrollLeft += SPEED * direction;
      }
      wrapIfNeeded();
      rafId = requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener("resize", measure);

    // Pausa al pasar el cursor o tocar la pantalla.
    viewport.addEventListener("mouseenter", () => (hoverPaused = true));
    viewport.addEventListener("mouseleave", () => (hoverPaused = false));
    viewport.addEventListener(
      "touchstart",
      () => (hoverPaused = true),
      { passive: true }
    );
    viewport.addEventListener("touchend", () => (hoverPaused = false));
    viewport.addEventListener("touchcancel", () => (hoverPaused = false));

    // Arrastre con mouse/touch (Pointer Events cubre ambos casos).
    // El arrastre recién empieza cuando el dedo/cursor se movió de verdad:
    // hasta entonces el evento sigue su curso normal y el click llega al <a>.
    viewport.addEventListener("pointerdown", (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      pointerDown = true;
      dragStartX = ev.clientX;
      dragStartScroll = viewport.scrollLeft;
    });

    viewport.addEventListener("pointermove", (ev) => {
      if (!pointerDown) return;
      const delta = ev.clientX - dragStartX;

      if (!isDragging) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return;
        isDragging = true;
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture?.(ev.pointerId);
      }

      viewport.scrollLeft = dragStartScroll - delta;
    });

    const endDrag = (ev) => {
      if (isDragging) {
        // Soltar después de arrastrar no debe navegar a la obra.
        suppressClick = true;
        if (ev && viewport.hasPointerCapture?.(ev.pointerId)) {
          viewport.releasePointerCapture(ev.pointerId);
        }
      }
      pointerDown = false;
      isDragging = false;
      viewport.classList.remove("is-dragging");
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", endDrag);

    // Se cancela sólo el click que cierra un arrastre; el click limpio pasa.
    viewport.addEventListener(
      "click",
      (ev) => {
        if (!suppressClick) return;
        suppressClick = false;
        ev.preventDefault();
        ev.stopPropagation();
      },
      true
    );

    // Pausa cuando la fila sale de pantalla, para no gastar CPU de más.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            offscreenPaused = prefersReduced || !entry.isIntersecting;
          });
        },
        { threshold: 0.01 }
      );
      io.observe(viewport);
    }

    rafId = requestAnimationFrame(tick);

    window.addEventListener("pagehide", () => rafId && cancelAnimationFrame(rafId));
  }

  /* -------------------- Botones "Ver en el directorio" --------------------*/
  document.querySelectorAll("[data-filter-link]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.filterLink;
      const select = document.getElementById("filterDiscipline");
      const directorio = document.getElementById("directorio");

      if (select) {
        const hasOption = Array.from(select.options).some(
          (opt) => opt.value === value
        );
        select.value = hasOption ? value : "all";
        select.dispatchEvent(new Event("change"));
      }

      if (directorio) {
        directorio.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "start",
        });
      }
    });
  });
})();

})();
