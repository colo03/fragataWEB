/* =====================================================================
   GALERÍA FRAGATA — fragata.js
   Helpers compartidos por todas las páginas. Se carga después de data.js.

   Viven acá y no en data.js porque data.js lo va a sobrescribir el
   generador de la hoja (ver docs/handoff-produccion.md §3 y §6).
   ===================================================================== */

window.FRAGATA = {
  /** Devuelve el artista con ese slug, o null si no existe. */
  getArtist(slug) {
    return window.FRAGATA_ARTISTS.find((a) => a.slug === slug) || null;
  },

  /**
   * Busca una obra y devuelve { work, artist }, o null si no existe.
   *
   * `artistSlug` es opcional y sólo sirve para acortar la búsqueda: si no
   * viene (o viene mal), se recorren todos los artistas. Así un link a
   * obra.html?slug=xxx sigue funcionando aunque se pierda el ?artista=.
   */
  getWork(workSlug, artistSlug) {
    if (!workSlug) return null;

    const search = (artist) => {
      const work = artist.works.find((w) => w.slug === workSlug);
      return work ? { work, artist } : null;
    };

    const hinted = artistSlug ? window.FRAGATA.getArtist(artistSlug) : null;
    if (hinted) {
      const found = search(hinted);
      if (found) return found;
    }

    for (const artist of window.FRAGATA_ARTISTS) {
      const found = search(artist);
      if (found) return found;
    }
    return null;
  },

  /** Lee un parámetro de la URL actual. */
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  /** Escapa texto antes de meterlo en innerHTML. */
  escape(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  },

  /**
   * Devuelve el markup de una imagen, o un placeholder rayado si todavía
   * no hay foto cargada. Unifica el criterio en todo el sitio.
   */
  media(src, alt, className, placeholderLabel) {
    const e = window.FRAGATA.escape;
    return src
      ? `<img src="${e(src)}" alt="${e(alt)}" class="${e(className)}" loading="lazy" />`
      : `<div class="${e(className)}" data-placeholder="${e(placeholderLabel)}" role="img" aria-label="${e(alt)}"></div>`;
  },

  /** Link a una obra. El ?artista= es sólo una pista para la búsqueda. */
  workUrl(work, artist) {
    return `obra.html?slug=${encodeURIComponent(work.slug)}&artista=${encodeURIComponent(artist.slug)}`;
  },

  /** Tarjeta de obra para los carruseles (perfil de artista y de obra). */
  workCard(work, artist) {
    const { escape: e, media, workUrl } = window.FRAGATA;
    // Datos secundarios: se muestran sólo los que están cargados.
    const specs = [work.technique, work.size].filter(Boolean).join(" · ");
    return `
      <li class="carousel__item">
        <a class="work-card" href="${e(workUrl(work, artist))}">
          <div class="work-card__media">
            ${media(work.photo, work.title, "work-card__photo", "Foto de la obra")}
          </div>
          <div class="work-card__body">
            <h3 class="work-card__title">${e(work.title)}</h3>
            ${work.year ? `<p class="work-card__year">${e(work.year)}</p>` : ""}
            ${specs ? `<p class="work-card__specs">${e(specs)}</p>` : ""}
            <span class="work-card__cta">Ver obra <span aria-hidden="true">→</span></span>
          </div>
        </a>
      </li>`;
  },
};
