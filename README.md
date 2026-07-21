# Galería Fragata — Landing (template base)

Landing page de arranque para **Fragata**, galería itinerante nocturna.
Pensada como *template / idea principal* para el desarrollo de la web.

Basada en el **Manual de Marca Fragata** y en la línea estética de las referencias
(ladoble.tv · primocontent.com · la-corte.com.ar): oscuro, alto contraste,
editorial y minimalista, con grillas tipo portfolio.

## Estructura

```
fragataWeb/
├─ index.html         → marcado de la landing (sección "Inicio" + teasers)
├─ css/styles.css     → sistema visual (paleta, tipografía, layout, responsive)
├─ js/main.js         → navbar, menú mobile, reveal on scroll, scrollspy, parallax
└─ assets/            → logos extraídos del manual (PNG con transparencia)
   ├─ isologo_white/black.png    (bandera + "fra ga ta")
   ├─ isotipo_white/black.png    (bandera sola)
   ├─ fragata_white/black.png    (wordmark "FRAGATA" pincelado)
   └─ favicon.png / favicon-32.png
```

## Cómo verlo

Cualquier servidor estático. Por ejemplo:

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Navegación y secciones

Barra fija con: **Inicio · Artistas · Nosotros · Eventos · Contacto**.

Orden real de la página (una sola landing con anclas):

1. **Inicio** (`#inicio`) — hero minimal: logo + "Galería itinerante nocturna".
2. **Nosotros** (`#nosotros`) — texto de marca + links a redes sociales.
3. **Artistas** (`#artistas`) — *roster* de artistas: foto + nombre + disciplina.
4. **Eventos** (`#eventos`) — próximo evento (destacado) + eventos pasados.
5. **Contacto** (`#contacto`) — newsletter + "Trabajá con nosotros".

## Páginas por crear (fuera de esta landing)

Los enlaces marcados con `TODO` en `index.html` apuntan a `#` y esperan página propia:

- **Perfil de artista** — al hacer click en una foto del roster. Debe mostrar
  bio + todas las obras del artista.
- **Artistas por disciplina** — botón "Ver todos por disciplina" del roster.
- **Registro de evento** — al hacer click en un evento pasado (galería de fotos
  y contenido de esa noche).

## Qué falta configurar (placeholders)

Todos los textos entre corchetes `[...]` y los marcados `[Placeholder]` son
genéricos y están para reemplazar. Puntos clave:

- **Copy**: tagline del hero, texto de "Nosotros", eventos, contacto.
- **Imágenes**: los tiles con `data-placeholder` (fotos de artistas, afiche del
  próximo evento, registros de pasados) se reemplazan por `<img>` reales.
- **Datos**: fechas, sedes, redes sociales (Instagram/TikTok/Spotify), correo,
  WhatsApp (Nosotros, Contacto y footer).
- **Formulario** (`.contact__form` en `js/main.js`): conectar a un servicio real
  (Formspree / Mailchimp / backend). Hoy es una demo visual.

## Marca

- **Paleta** (manual): principal `#000 · #FFF · #8B8B8B`; secundaria
  `#373737 · #8A8A8A · #BCBCBC`. El manual habilita cambiar los colores por
  curaduría/evento → variable única `--accent` en `styles.css` para tematizar.
- **Tipografía**: el manual pide **Alte Haas Grotesk** (Bold títulos / Regular textos).
  Es gratuita; para producción, auto-hospedar el `.woff2` en `assets/fonts` y
  declarar `@font-face`. Mientras tanto se usa **Hanken Grotesk** (Google Fonts)
  como sustituto casi idéntico. La tipografía "manual" (dibujada) del logo ya
  viene resuelta con los assets PNG del wordmark.

## Notas técnicas

- Sin dependencias ni build. HTML/CSS/JS vanilla.
- Accesibilidad: skip-link, `aria-*` en navegación y menú, foco visible,
  `prefers-reduced-motion` respetado.
- Responsive: desktop (grilla 4 col) → tablet (2 col) → mobile (1 col + menú lateral).
