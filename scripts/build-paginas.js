#!/usr/bin/env node
/* =====================================================================
   GALERÍA FRAGATA — build-paginas.js
   Lo corre Netlify en cada deploy (ver netlify.toml). Sin dependencias.

   1. Arma dist/ con lo público del sitio: los .html de la raíz, css/,
      js/ y assets/. Nada de docs/, README, el PDF ni scripts/.
   2. Carga js/data.js y valida el contrato (docs/handoff-produccion.md §3).
      Si algo no cumple, el build falla y Netlify deja online el deploy
      anterior, sin gastar créditos.
   3. Avisa de referencias locales rotas (href/src a archivos que no
      existen en dist/). Solo avisa: no frena el deploy.

   Pendiente (handoff §8): generar una página por artista y por obra con
   sus meta tags de Open Graph.

   Uso local:  node scripts/build-paginas.js
   ===================================================================== */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PUBLIC_DIRS = ["css", "js", "assets"];
// Archivos de configuración de Netlify que viajan con el sitio si existen
const PUBLIC_FILES = ["_redirects", "_headers", "robots.txt", "sitemap.xml"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(errores) {
  console.error("\n✗ Build abortado:\n");
  errores.forEach((e) => console.error("  - " + e));
  console.error("");
  process.exit(1);
}

/* ---------- 1. Copiar lo público a dist/ ---------- */

function copiarSitio() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const htmls = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
  if (!htmls.includes("index.html")) fail(["No existe index.html en la raíz."]);

  for (const f of [...htmls, ...PUBLIC_FILES]) {
    const origen = path.join(ROOT, f);
    if (fs.existsSync(origen)) fs.copyFileSync(origen, path.join(DIST, f));
  }
  for (const dir of PUBLIC_DIRS) {
    const origen = path.join(ROOT, dir);
    if (fs.existsSync(origen)) fs.cpSync(origen, path.join(DIST, dir), { recursive: true });
  }
  return htmls;
}

/* ---------- 2. Cargar y validar data.js ---------- */

function cargarArtistas() {
  const archivo = path.join(ROOT, "js", "data.js");
  const sandbox = { window: {} };
  try {
    vm.runInNewContext(fs.readFileSync(archivo, "utf8"), sandbox, { filename: "js/data.js" });
  } catch (err) {
    fail([`js/data.js no se pudo ejecutar: ${err.message}`]);
  }
  return sandbox.window.FRAGATA_ARTISTS;
}

function validar(artistas) {
  if (!Array.isArray(artistas)) {
    fail(["js/data.js no define window.FRAGATA_ARTISTS como array."]);
  }

  const errores = [];
  const slugsArtistas = new Set();

  artistas.forEach((a, i) => {
    const donde = `artista #${i + 1}${a && a.slug ? ` (${a.slug})` : ""}`;
    if (!a || typeof a !== "object") return errores.push(`${donde}: no es un objeto.`);

    if (!a.slug || !SLUG_RE.test(a.slug)) errores.push(`${donde}: slug inválido o vacío.`);
    else if (slugsArtistas.has(a.slug)) errores.push(`${donde}: slug repetido.`);
    else slugsArtistas.add(a.slug);

    if (!a.name) errores.push(`${donde}: falta name.`);
    if (!a.discipline) errores.push(`${donde}: falta discipline.`);
    if (a.bio != null && !Array.isArray(a.bio)) errores.push(`${donde}: bio tiene que ser un array.`);
    if (!Array.isArray(a.works)) return errores.push(`${donde}: works tiene que ser un array (aunque sea []).`);

    const slugsObras = new Set();
    a.works.forEach((w, j) => {
      const dondeObra = `${donde}, obra #${j + 1}${w && w.slug ? ` (${w.slug})` : ""}`;
      if (!w || typeof w !== "object") return errores.push(`${dondeObra}: no es un objeto.`);
      if (!w.slug || !SLUG_RE.test(w.slug)) errores.push(`${dondeObra}: slug inválido o vacío.`);
      else if (slugsObras.has(w.slug)) errores.push(`${dondeObra}: slug repetido dentro del artista.`);
      else slugsObras.add(w.slug);
      if (!w.title) errores.push(`${dondeObra}: falta title.`);
    });
  });

  if (errores.length) fail(errores);
}

/* ---------- 3. Referencias locales rotas ---------- */

function avisarReferenciasRotas(htmls) {
  const ATTR_RE = /\b(?:href|src)\s*=\s*"([^"]*)"/g;
  const EXTERNA_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i; // http:, mailto:, data:, //cdn, #ancla
  const rotas = [];

  for (const html of htmls) {
    const contenido = fs.readFileSync(path.join(DIST, html), "utf8");
    for (const [, ref] of contenido.matchAll(ATTR_RE)) {
      if (!ref || EXTERNA_RE.test(ref)) continue;
      const ruta = ref.split(/[?#]/)[0];
      if (!ruta) continue;
      const destino = ruta.startsWith("/") ? path.join(DIST, ruta) : path.join(DIST, path.dirname(html), ruta);
      if (!fs.existsSync(destino)) rotas.push(`${html} → ${ref}`);
    }
  }

  if (rotas.length) {
    console.warn(`\n⚠ ${rotas.length} referencia(s) a archivos que no existen:`);
    [...new Set(rotas)].forEach((r) => console.warn("  - " + r));
    console.warn("");
  }
}

/* ---------- main ---------- */

const htmls = copiarSitio();
const artistas = cargarArtistas();
validar(artistas);
avisarReferenciasRotas(htmls);

const obras = artistas.reduce((n, a) => n + a.works.length, 0);
console.log(`✓ dist/ listo: ${htmls.length} páginas, ${artistas.length} artistas, ${obras} obras.`);
