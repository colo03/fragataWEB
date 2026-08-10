/* =====================================================================
   GALERÍA FRAGATA — evento.js
   Lógica exclusiva del archivo histórico: lightbox de la galería de
   registro (#galleryGrid). Funciona tanto con las fotos reales
   ([data-full] apuntando al archivo grande) como con los placeholders
   rayados de ejemplo — en ese caso sólo amplía el bloque.

   Corre ANTES que main.js, igual que el resto de los scripts de página.
   ===================================================================== */

(function () {
  "use strict";

  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll(".event-gallery__item"));
  if (!items.length) return;

  /* -------------------- Arma el markup del lightbox una sola vez -------------------- */
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Foto ampliada del registro");
  lightbox.innerHTML = `
    <button type="button" class="lightbox__prev" aria-label="Foto anterior">
      <span aria-hidden="true">←</span>
    </button>
    <img class="lightbox__img" alt="" />
    <button type="button" class="lightbox__next" aria-label="Foto siguiente">
      <span aria-hidden="true">→</span>
    </button>
    <button type="button" class="lightbox__close" aria-label="Cerrar">
      <span aria-hidden="true">✕</span>
    </button>
  `;
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector(".lightbox__img");
  const btnClose = lightbox.querySelector(".lightbox__close");
  const btnPrev = lightbox.querySelector(".lightbox__prev");
  const btnNext = lightbox.querySelector(".lightbox__next");

  let currentIndex = 0;
  let lastFocused = null;

  /* -------------------- Fuente de la imagen ampliada --------------------
     Prioridad: data-full (foto real en tamaño grande) > <img> interno
     de la tarjeta > el propio texto del placeholder, para que el ejemplo
     sin fotos cargadas también se pueda "abrir". */
  const sourceFor = (item) => {
    const full = item.dataset.full;
    const innerImg = item.querySelector("img");
    return {
      src: full || (innerImg && innerImg.src) || "",
      alt: (innerImg && innerImg.alt) || item.getAttribute("aria-label") || "",
      placeholderLabel: item.dataset.placeholder || null,
    };
  };

  const open = (index) => {
    currentIndex = (index + items.length) % items.length;
    const { src, alt, placeholderLabel } = sourceFor(items[currentIndex]);

    if (src) {
      imgEl.hidden = false;
      imgEl.src = src;
      imgEl.alt = alt;
      lightbox.removeAttribute("data-placeholder");
    } else {
      // Sin foto real todavía: se muestra el mismo rayado del placeholder,
      // ampliado, en vez de una imagen rota.
      imgEl.hidden = true;
      lightbox.setAttribute("data-placeholder", placeholderLabel || "Foto del registro");
    }

    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    btnClose.focus();
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  };

  items.forEach((item, index) => {
    item.addEventListener("click", () => open(index));
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => open(currentIndex - 1));
  btnNext.addEventListener("click", () => open(currentIndex + 1));

  // Clic afuera de la imagen: cierra.
  lightbox.addEventListener("click", (ev) => {
    if (ev.target === lightbox) close();
  });

  // Navegación por teclado.
  document.addEventListener("keydown", (ev) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (ev.key === "Escape") close();
    if (ev.key === "ArrowLeft") open(currentIndex - 1);
    if (ev.key === "ArrowRight") open(currentIndex + 1);
  });
})();