/* =====================================================================
   GALERÍA FRAGATA — carrusel.js
   Carrusel horizontal reutilizable (perfil de artista y perfil de obra).

   El scroll lo hace el navegador con scroll-snap nativo: anda con dedo,
   trackpad, rueda y teclado aunque este archivo no llegue a cargar.
   Acá sólo se agregan los botones y su estado.

   Uso:
     <section class="works">
       <div class="carousel__nav">
         <button data-carousel-prev>…</button>
         <button data-carousel-next>…</button>
       </div>
       <div class="carousel" data-carousel>
         <ul class="carousel__track"> … </ul>
       </div>
     </section>

     window.initCarousel(document.querySelector("[data-carousel]"));
   ===================================================================== */

(function () {
  "use strict";

  window.initCarousel = function initCarousel(root) {
    if (!root) return;

    const trackEl = root.querySelector(".carousel__track");
    // Los botones se buscan dentro de la MISMA sección, no en todo el
    // documento: si no, con dos carruseles en una página los dos
    // terminarían manejando el primero.
    const section = root.closest("section") || document;
    const prevBtn = section.querySelector("[data-carousel-prev]");
    const nextBtn = section.querySelector("[data-carousel-next]");
    if (!trackEl || !prevBtn || !nextBtn) return;

    // Un "paso" = ancho de una tarjeta + el gap entre tarjetas.
    const step = () => {
      const item = trackEl.querySelector(".carousel__item");
      if (!item) return trackEl.clientWidth;
      const gap = parseFloat(getComputedStyle(trackEl).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
    };

    const scrollByStep = (dir) => {
      trackEl.scrollBy({
        left: dir * step(),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };

    prevBtn.addEventListener("click", () => scrollByStep(-1));
    nextBtn.addEventListener("click", () => scrollByStep(1));

    // Apaga los botones al llegar a cada extremo. El margen de 2px absorbe
    // los redondeos a subpíxel del scroll, que si no dejan "next" activo
    // para siempre al final del track.
    const syncButtons = () => {
      const max = trackEl.scrollWidth - trackEl.clientWidth;
      prevBtn.disabled = trackEl.scrollLeft <= 2;
      nextBtn.disabled = trackEl.scrollLeft >= max - 2;
      // Si entran todas las obras en pantalla, los botones no hacen falta.
      if (section.classList) section.classList.toggle("is-static", max <= 2);
    };

    trackEl.addEventListener("scroll", syncButtons, { passive: true });
    window.addEventListener("resize", syncButtons);
    syncButtons();

    // Flechas del teclado cuando el track tiene el foco.
    trackEl.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        scrollByStep(1);
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        scrollByStep(-1);
      }
    });
  };
})();
