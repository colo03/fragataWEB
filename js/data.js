/* =====================================================================
   GALERÍA FRAGATA — data.js
   Fuente única de datos de artistas y obras.

   Todo el sitio lee de acá: la grilla del index, el buscador y los
   perfiles individuales (artista.html?slug=...).
   Para sumar un artista, agregá un objeto a la lista. No hace falta
   tocar HTML ni JS.

   Campos:
     slug        · id para la URL. Sin espacios, tildes ni mayúsculas.
                   Tiene que ser único y no debería cambiar nunca
                   (si cambia, se rompen los links ya compartidos).
     photo       · ruta a la foto. null = muestra el placeholder rayado.
     bio         · array de párrafos.
     works[]     · obras del artista. La primera es la que se muestra
                   en la tarjeta de la grilla del index.
   ===================================================================== */

window.FRAGATA_ARTISTS = [
  {
    slug: "ana-perez",
    name: "Ana Pérez",
    discipline: "Pintura",
    // TODO: reemplazar por foto real, ej. "assets/artistas/ana-perez.jpg"
    photo: null,
    city: "[Buenos Aires, AR]",
    since: "[2019]",
    bio: [
      "[Placeholder] Ana trabaja la pintura al óleo desde una búsqueda sobre la luz nocturna y los espacios que quedan vacíos cuando la ciudad se apaga.",
      "[Placeholder] Su obra fue exhibida en distintas ediciones de Fragata y en espacios independientes de la zona sur. Reemplazar por bio real.",
    ],
    links: {
      instagram: "#",
      web: null,
    },
    works: [
      {
        slug: "serenidad-cosmica",
        title: "Serenidad Cósmica",
        year: "[2025]",
        technique: "[Óleo sobre tela]",
        size: "[120 × 90 cm]",
        photo: null,
        // `desc` es opcional: si no está, el párrafo no se muestra.
        desc: "[Placeholder] Texto descriptivo de la obra: qué la motivó, cómo se hizo, dónde se expuso. Este campo es opcional — las obras que no lo tengan simplemente no muestran el párrafo.",
      },
      {
        slug: "noche-baja",
        title: "Noche Baja",
        year: "[2024]",
        technique: "[Óleo sobre tela]",
        size: "[80 × 60 cm]",
        photo: null,
      },
      {
        slug: "interior-con-lampara",
        title: "Interior con Lámpara",
        year: "[2024]",
        technique: "[Óleo sobre madera]",
        size: "[45 × 45 cm]",
        photo: null,
      },
      {
        slug: "ultimo-tren",
        title: "Último Tren",
        year: "[2023]",
        technique: "[Óleo sobre tela]",
        size: "[150 × 100 cm]",
        photo: null,
      },
      {
        slug: "vereda-vacia",
        title: "Vereda Vacía",
        year: "[2023]",
        technique: "[Acrílico sobre papel]",
        size: "[50 × 70 cm]",
        photo: null,
      },
    ],
  },

  {
    slug: "carlos-gomez",
    name: "Carlos Gómez",
    discipline: "Fotografía",
    photo: null,
    city: "[Rosario, AR]",
    since: "[2017]",
    bio: [
      "[Placeholder] Carlos fotografía la ciudad desde sus reflejos: vidrieras, charcos, chapas. Un registro documental que termina siendo abstracto.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: null },
    works: [
      {
        slug: "reflejos-urbanos",
        title: "Reflejos Urbanos",
        year: "[2025]",
        technique: "[Fotografía digital, impresión fine art]",
        size: "[60 × 90 cm]",
        photo: null,
      },
      {
        slug: "esquina-9-de-julio",
        title: "Esquina 9 de Julio",
        year: "[2024]",
        technique: "[Fotografía analógica 35mm]",
        size: "[40 × 60 cm]",
        photo: null,
      },
      {
        slug: "lluvia-de-marzo",
        title: "Lluvia de Marzo",
        year: "[2024]",
        technique: "[Fotografía digital]",
        size: "[50 × 70 cm]",
        photo: null,
      },
      {
        slug: "chapa-y-cielo",
        title: "Chapa y Cielo",
        year: "[2022]",
        technique: "[Fotografía digital]",
        size: "[70 × 100 cm]",
        photo: null,
      },
    ],
  },

  {
    slug: "sofia-rossi",
    name: "Sofía Rossi",
    discipline: "Instalación",
    photo: null,
    city: "[Buenos Aires, AR]",
    since: "[2020]",
    bio: [
      "[Placeholder] Sofía construye instalaciones sonoras y lumínicas que se activan con el movimiento del público.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: "#" },
    works: [
      {
        slug: "laberinto-de-ecos",
        title: "Laberinto de Ecos",
        year: "[2025]",
        technique: "[Instalación sonora, dimensiones variables]",
        size: "[Variable]",
        photo: null,
      },
      {
        slug: "camara-blanca",
        title: "Cámara Blanca",
        year: "[2024]",
        technique: "[Instalación lumínica]",
        size: "[Variable]",
        photo: null,
      },
      {
        slug: "sin-titulo-iii",
        title: "Sin Título III",
        year: "[2023]",
        technique: "[Técnica mixta]",
        size: "[200 × 200 × 180 cm]",
        photo: null,
      },
    ],
  },

  {
    slug: "javier-nunez",
    name: "Javier Núñez",
    discipline: "Escultura",
    photo: null,
    city: "[Córdoba, AR]",
    since: "[2015]",
    bio: [
      "[Placeholder] Javier trabaja el metal y la resina buscando el punto exacto en que una forma rígida parece a punto de derramarse.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: null },
    works: [
      {
        slug: "forma-fluida",
        title: "Forma Fluida",
        year: "[2025]",
        technique: "[Bronce fundido]",
        size: "[60 × 30 × 30 cm]",
        photo: null,
      },
      {
        slug: "peso-muerto",
        title: "Peso Muerto",
        year: "[2024]",
        technique: "[Hierro y resina]",
        size: "[110 × 40 × 40 cm]",
        photo: null,
      },
      {
        slug: "columna-rota",
        title: "Columna Rota",
        year: "[2022]",
        technique: "[Mármol]",
        size: "[180 × 45 × 45 cm]",
        photo: null,
      },
    ],
  },

  {
    slug: "valentina-rojas",
    name: "Valentina Rojas",
    discipline: "Pintura",
    photo: null,
    city: "[Mendoza, AR]",
    since: "[2021]",
    bio: [
      "[Placeholder] Valentina pinta retratos de gente que no está: describe a alguien a partir de los objetos que dejó.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: null },
    works: [
      {
        slug: "retrato-del-viento",
        title: "Retrato del Viento",
        year: "[2025]",
        technique: "[Acrílico sobre tela]",
        size: "[100 × 80 cm]",
        photo: null,
      },
      {
        slug: "la-silla",
        title: "La Silla",
        year: "[2024]",
        technique: "[Óleo sobre tela]",
        size: "[70 × 50 cm]",
        photo: null,
      },
      {
        slug: "domingo",
        title: "Domingo",
        year: "[2023]",
        technique: "[Acrílico sobre papel]",
        size: "[40 × 30 cm]",
        photo: null,
      },
    ],
  },

  {
    slug: "mateo-diaz",
    name: "Mateo Díaz",
    discipline: "Fotografía",
    photo: null,
    city: "[Bariloche, AR]",
    since: "[2018]",
    bio: [
      "[Placeholder] Mateo trabaja en la frontera entre el registro naturalista y la puesta en escena.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: null },
    works: [
      {
        slug: "naturaleza-oculta",
        title: "Naturaleza Oculta",
        year: "[2025]",
        technique: "[Fotografía digital]",
        size: "[80 × 120 cm]",
        photo: null,
      },
      {
        slug: "bosque-quemado",
        title: "Bosque Quemado",
        year: "[2023]",
        technique: "[Fotografía digital]",
        size: "[60 × 90 cm]",
        photo: null,
      },
    ],
  },

  {
    slug: "lucia-fernandez",
    name: "Lucía Fernández",
    discipline: "Instalación",
    photo: null,
    city: "[Buenos Aires, AR]",
    since: "[2022]",
    bio: [
      "[Placeholder] Lucía usa luz, espejos y humo para armar volúmenes que solo existen mientras se los mira.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: "#" },
    works: [
      {
        slug: "dialogos-de-luz",
        title: "Diálogos de Luz",
        year: "[2025]",
        technique: "[Instalación lumínica]",
        size: "[Variable]",
        photo: null,
      },
      {
        slug: "humo-i",
        title: "Humo I",
        year: "[2024]",
        technique: "[Instalación, técnica mixta]",
        size: "[Variable]",
        photo: null,
      },
    ],
  },

  {
    slug: "diego-morales",
    name: "Diego Morales",
    discipline: "Escultura",
    photo: null,
    city: "[La Plata, AR]",
    since: "[2016]",
    bio: [
      "[Placeholder] Diego arma estructuras que se sostienen al límite, donde sacar una sola pieza haría caer todo el conjunto.",
      "[Placeholder] Reemplazar por bio real.",
    ],
    links: { instagram: "#", web: null },
    works: [
      {
        slug: "tension-y-equilibrio",
        title: "Tensión y Equilibrio",
        year: "[2025]",
        technique: "[Acero y madera]",
        size: "[200 × 80 × 80 cm]",
        photo: null,
      },
      {
        slug: "apilamiento",
        title: "Apilamiento",
        year: "[2024]",
        technique: "[Hormigón]",
        size: "[90 × 40 × 40 cm]",
        photo: null,
      },
      {
        slug: "contrapeso",
        title: "Contrapeso",
        year: "[2021]",
        technique: "[Acero]",
        size: "[150 × 60 × 60 cm]",
        photo: null,
      },
    ],
  },
];

/* Helpers compartidos ------------------------------------------------ */
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
