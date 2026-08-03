/* =====================================================================
   GALERÍA FRAGATA — obra.js
   Arma el perfil de obra leyendo ?slug=<obra>&artista=<artista> de la URL.

   Corre ANTES que main.js (ver orden de <script> en obra.html) para que
   las tarjetas inyectadas acá ya existan cuando main.js engancha el
   reveal-on-scroll y la lógica del formulario.
   ===================================================================== */

(function () {
  "use strict";

  const { getWork, getParam, escape: e, media, workCard } = window.FRAGATA;

  const found = getWork(getParam("slug"), getParam("artista"));

  /* -------------------- Slug inexistente: estado 404 -------------------- */
  if (!found) {
    document.getElementById("workNotFound").hidden = false;
    document.title = "Obra no encontrada — Galería Fragata";
    return;
  }

  const { work, artist } = found;
  document.getElementById("workMain").hidden = false;

  /* -------------------- Head: título, SEO y compartir -------------------- */
  const pageTitle = `${work.title} — ${artist.name} — Galería Fragata`;
  const pageDesc =
    work.desc ||
    `${work.title}, obra de ${artist.name} en Galería Fragata.`;

  document.title = pageTitle;
  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", value);
  };
  setMeta('meta[name="description"]', pageDesc);
  setMeta('meta[property="og:title"]', `${work.title} — ${artist.name}`);
  setMeta('meta[property="og:description"]', pageDesc);

  /* -------------------- Migas de pan -------------------- */
  const artistUrl = `artista.html?slug=${encodeURIComponent(artist.slug)}`;
  const crumbArtist = document.getElementById("crumbArtist");
  crumbArtist.textContent = artist.name;
  crumbArtist.href = artistUrl;
  document.getElementById("crumbWork").textContent = work.title;

  /* -------------------- Ficha de la obra -------------------- */
  document.getElementById("workTitle").textContent = work.title;

  const artistLink = document.getElementById("workArtistLink");
  artistLink.textContent = artist.name;
  artistLink.href = artistUrl;

  document.getElementById("workPhoto").innerHTML = media(
    work.photo,
    `${work.title}, de ${artist.name}`,
    "artwork__photo",
    "Foto de la obra"
  );

  // Sólo se listan los datos que existen: si falta el año, no queda un hueco.
  const metaRows = [
    ["Técnica", work.technique],
    ["Año", work.year],
    ["Medidas", work.size],
  ].filter(([, value]) => value);

  document.getElementById("workMeta").innerHTML = metaRows
    .map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`)
    .join("");

  if (work.desc) {
    const descEl = document.getElementById("workDesc");
    descEl.textContent = work.desc;
    descEl.hidden = false;
  }

  /* -------------------- Formulario de consulta -------------------- */
  // El nombre de la obra viaja en campos ocultos para saber por cuál escriben.
  document.getElementById("interestWorkName").textContent = `"${work.title}"`;
  document.getElementById("fieldObra").value = work.title;
  document.getElementById("fieldArtista").value = artist.name;

  /* -------------------- Carrusel: otras obras del artista -------------------- */
  const others = artist.works.filter((w) => w.slug !== work.slug);

  if (others.length) {
    const section = document.getElementById("mas-obras");
    section.hidden = false;
    document.getElementById("moreWorksTitle").textContent =
      `Más de ${artist.name}`;
    document.getElementById("moreWorksTrack").innerHTML = others
      .map((w) => workCard(w, artist))
      .join("");

    window.initCarousel(section.querySelector("[data-carousel]"));
  }
})();
