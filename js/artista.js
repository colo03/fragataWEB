/* =====================================================================
   GALERÃA FRAGATA â€” artista.js
   Arma el perfil de artista leyendo el ?slug= de la URL contra data.js.

   Corre ANTES que main.js (ver orden de <script> en artista.html) para
   que las tarjetas que inyecta acÃ¡ ya existan cuando main.js engancha
   el reveal-on-scroll.
   ===================================================================== */

(function () {
  "use strict";

  const { getArtist, getParam, escape: e, media, workCard } = window.FRAGATA;

  const artist = getArtist(getParam("slug"));

  const mainEl = document.getElementById("artistMain");
  const notFoundEl = document.getElementById("artistNotFound");

  /* -------------------- Slug inexistente: estado 404 -------------------- */
  if (!artist) {
    notFoundEl.hidden = false;
    document.title = "Artista no encontrado â€” GalerÃ­a Fragata";
    return;
  }

  mainEl.hidden = false;

  /* -------------------- Head: tÃ­tulo, SEO y compartir -------------------- */
  const pageTitle = `${artist.name} â€” GalerÃ­a Fragata`;
  const pageDesc = artist.bio[0] || `Perfil de ${artist.name} en GalerÃ­a Fragata.`;

  document.title = pageTitle;
  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", value);
  };
  setMeta('meta[name="description"]', pageDesc);
  setMeta('meta[property="og:title"]', pageTitle);
  setMeta('meta[property="og:description"]', pageDesc);

  /* -------------------- Cabecera del perfil -------------------- */
  document.getElementById("crumbName").textContent = artist.name;
  document.getElementById("artistName").textContent = artist.name;
  document.getElementById("artistDiscipline").textContent = artist.discipline;

  document.getElementById("artistPhoto").innerHTML = media(
    artist.photo,
    `Retrato de ${artist.name}`,
    "artist-profile__photo",
    "Foto del artista"
  );

  document.getElementById("artistBio").innerHTML = artist.bio
    .map((p) => `<p>${e(p)}</p>`)
    .join("");

  // SÃ³lo se listan los datos que existen: si falta ciudad, no queda un hueco.
  const metaRows = [
    ["Disciplina", artist.discipline],
    ["Base", artist.city],
    ["En Fragata desde", artist.since],
    ["Obras", artist.works.length ? String(artist.works.length) : null],
  ].filter(([, value]) => value);

  document.getElementById("artistMeta").innerHTML = metaRows
    .map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`)
    .join("");

  /* -------------------- Redes del artista -------------------- */
  const linksEl = document.getElementById("artistLinks");
  const socials = [
    ["Instagram", artist.links && artist.links.instagram],
    ["Sitio web", artist.links && artist.links.web],
  ].filter(([, href]) => href);

  if (socials.length) {
    linksEl.hidden = false;
    linksEl.insertAdjacentHTML(
      "beforeend",
      socials
        .map(
          ([label, href]) =>
            `<a href="${e(href)}" class="social-link" target="_blank" rel="noopener">${e(label)} <span>â†—</span></a>`
        )
        .join("")
    );
  }

  /* -------------------- Carrusel de obras -------------------- */
  const track = document.getElementById("worksTrack");
  const worksEmpty = document.getElementById("worksEmpty");
  const carousel = document.querySelector("[data-carousel]");

  if (!artist.works.length) {
    carousel.hidden = true;
    worksEmpty.hidden = false;
  } else {
    track.innerHTML = artist.works.map((work) => workCard(work, artist)).join("");
    window.initCarousel(carousel);
  }
})();
