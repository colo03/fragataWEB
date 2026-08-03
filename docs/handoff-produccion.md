# Handoff — De acá al lanzamiento

Cómo seguir desde el estado actual del repo hasta tener la web en producción,
usando **Google Sheets como base de datos**, y qué hace falta el día que
convenga migrar a un servicio de almacenamiento real.

Documento hermano: [`sistema-carga-contenido.md`](sistema-carga-contenido.md)
(transcripción de la propuesta original en PDF).

---

## 1. Dónde estamos hoy

### Lo que funciona

| Pieza | Estado |
|---|---|
| `index.html` | Grilla de artistas con buscador, filtro por disciplina y orden A-Z / Z-A |
| `artista.html` | Perfil por artista vía `?slug=`, con carrusel de obras |
| `obra.html` | Perfil por obra vía `?slug=&artista=`, con carrusel "más del artista" |
| `js/data.js` | Fuente única de datos (8 artistas de ejemplo, 25 obras) |
| `js/carrusel.js` | Carrusel compartido por las dos páginas de detalle |
| `css/styles.css` | Sistema visual completo, responsive, con modo reduced-motion |

Las tres páginas leen de `data.js`. Cambiar un dato ahí se refleja en todas.

### Lo que NO está conectado

- **`eventos.html` está hardcodeado.** No lee `data.js`; los tres eventos del
  timeline y el destacado están escritos a mano en el HTML. Queda fuera de este
  plan salvo que se decida sumarlo (ver §8).
- **Ninguna foto es real.** Todo el sitio muestra placeholders rayados.
- **Los formularios no envían nada.** Ver §4, son bloqueantes.

---

## 2. La arquitectura elegida

```
Google Form  ──►  Google Sheets  ──►  Apps Script  ──►  data.js  ──►  GitHub Pages
  (carga)          (base de datos)    (botón Publicar)   (commit)      (sitio vivo)
```

**El sitio nunca le habla a Google.** El script lee la hoja, arma el archivo y lo
commitea. El visitante recibe HTML y JS estáticos.

### Por qué así y no consultando la hoja en vivo

- **Para leer una hoja desde el navegador hay que publicarla entera**, incluidos
  el email de cada artista, los precios y las filas todavía sin aprobar. Y toda
  columna que alguien agregue en el futuro queda pública por default.
- **El sitio no depende de que Google responda.** Si Google anda lento, si
  alguien renombra una pestaña o revoca un permiso, el sitio sigue igual.
- **Publicar es un acto deliberado.** Alguien aprieta el botón: ahí vive el paso
  de curaduría que pedía el documento original, sin panel ni tabla aparte.

Lo que se pierde: los cambios no aparecen solos. Para una galería que carga
contenido por tandas antes de cada muestra, no es una pérdida real.

---

## 3. El contrato de datos

**Esto es lo más importante del handoff.** Mientras el generador produzca esta
forma exacta, no hay que tocar una línea de `main.js`, `artista.js` ni `obra.js`.

```js
window.FRAGATA_ARTISTS = [
  {
    slug:       "ana-perez",        // único, estable, [a-z0-9-]
    name:       "Ana Pérez",
    discipline: "Pintura",          // categórico — ver aviso abajo
    photo:      "assets/artistas/ana-perez.jpg",  // o null
    city:       "Buenos Aires, AR",
    since:      "2019",
    bio:        ["Primer párrafo.", "Segundo párrafo."],  // array
    links:      { instagram: "https://...", web: null },
    works: [
      {
        slug:      "serenidad-cosmica",   // único, estable
        title:     "Serenidad Cósmica",
        year:      "2025",
        technique: "Óleo sobre tela",
        size:      "120 × 90 cm",
        photo:     "assets/obras/serenidad-cosmica.jpg",  // o null
        desc:      "Texto curatorial."    // opcional
      }
    ]
  }
]
```

### Reglas que el generador tiene que respetar

1. **`slug` es sagrado.** Se genera una vez y no cambia nunca. Si cambia, se
   rompen todos los links ya compartidos. Guardalo como columna en la hoja; no
   lo recalcules a partir del nombre en cada corrida.
2. **Campo sin dato → `null`, no string vacío.** El sitio esconde la fila cuando
   el valor es falsy. Un `""` funciona, pero `null` deja la intención explícita.
3. **`bio` es un array**, aunque tenga un solo párrafo. Partir el texto de la
   hoja por doble salto de línea.
4. **`works` siempre existe**, aunque sea `[]`. Nada hace `.length` sobre
   undefined si respetás esto.
5. **`discipline` se compara con igualdad exacta** en el filtro del index.
   `"pintura"` y `"Pintura"` son dos disciplinas distintas. De ahí que el
   formulario tenga que usar desplegable y no texto libre.

### Quién consume qué

| Consumidor | Campos que usa |
|---|---|
| Grilla del index | `slug`, `name`, `discipline`, `photo`, `works[0].title` |
| Buscador | `name`, `discipline`, `works[].title`, `works[].technique` |
| Filtro disciplina | `discipline` (igualdad exacta) |
| `artista.html` | todos los del artista |
| `obra.html` | todos los de la obra + `name` y `slug` del artista |

---

## 4. Fase 0 — Bloqueantes antes de salir

Nada de esto depende de Sheets. Se puede hacer en paralelo.

- [ ] **Conectar el formulario "Me interesa esta obra".** Hoy simula el éxito:
      muestra "¡Gracias! ✓" y no le llega a nadie. Está marcado con un TODO en
      `js/main.js`. Alguien deja sus datos creyendo que consultó por una obra y
      ese mensaje se pierde. **Es el bloqueante más serio: no salgas sin esto.**
      Formspree o Google Forms vía POST resuelven en una tarde.
- [ ] **Conectar el formulario de newsletter** del index (`onsubmit="return false"`).
- [ ] **Reemplazar los datos de contacto.** `[correo@fragata.com]` y `[+54 9 ...]`
      aparecen literales en el footer de las cuatro páginas.
- [ ] **Escribir el "Nosotros"** del index (hoy `[Placeholder]`).
- [ ] **Links reales de redes** (hoy todos `href="#"`).
- [ ] **Foto y descripción para Open Graph.** Sin `og:image`, compartir el sitio
      por WhatsApp muestra una tarjeta vacía.
- [ ] **Generar las opciones del filtro de disciplina desde los datos.** Hoy
      están hardcodeadas en `index.html`. Si entra un artista de "Videoarte" por
      el Form, el dato llega bien pero el desplegable no lo va a ofrecer nunca.

---

## 5. Fase 1 — Armar las hojas

Un único documento de Sheets con dos pestañas. Los nombres de columna de acá son
los que va a buscar el generador: si los cambiás, actualizá el script.

### Pestaña `artistas`

| Columna | Origen | Notas |
|---|---|---|
| `timestamp` | Forms | automático |
| `slug` | Apps Script | **generado una vez, nunca se toca** |
| `nombre` | Form | obligatorio |
| `nombre_artistico` | Form | opcional; si está, se usa como `name` |
| `disciplina` | Form | desplegable, nunca texto libre |
| `bio` | Form | párrafos separados por línea en blanco |
| `ciudad` | Form | → `city` |
| `desde` | Form | → `since` |
| `instagram` | Form | URL completa |
| `web` | Form | opcional |
| `email` | Form | **interno, no se publica** |
| `foto_drive` | Form | link crudo de Drive |
| `foto_final` | manual / script | ruta o URL definitiva (ver §7) |
| `estado` | manual | `pendiente` / `publicado` — validación de datos |

### Pestaña `obras`

| Columna | Origen | Notas |
|---|---|---|
| `timestamp` | Forms | automático |
| `slug` | Apps Script | generado una vez |
| `artista_slug` | Form | **la clave foránea**; debe existir en `artistas` |
| `titulo` | Form | obligatorio |
| `anio` | Form | validación numérica |
| `tecnica` | Form | desplegable |
| `dimensiones` | Form | formato sugerido: alto × ancho × prof, cm |
| `descripcion` | Form | opcional → `desc` |
| `foto_drive` | Form | link crudo |
| `foto_final` | manual / script | ver §7 |
| `en_venta` | Form | interno por ahora, el sitio no lo muestra |
| `precio` | Form | **interno, no se publica** |
| `estado` | manual | `pendiente` / `publicado` |

### El vínculo obra → artista

Google Forms no puede leer en vivo los artistas ya cargados. Dos caminos:

- **Simple:** desplegable en el Form de obra con los nombres, actualizado a mano
  cuando entra un artista nuevo. Bien si no se cargan artistas seguido.
- **Prolijo:** el Apps Script genera el `slug` al llegar el alta y lo manda por
  mail; ese ID se pega como texto en el Form de obra. Cero mantenimiento, menos
  cómodo de usar.

Empezá por el simple. Si empieza a doler, migrás.

---

## 6. Fase 2 — El generador

Un Apps Script dentro del mismo documento de Sheets, con un menú propio
(*Fragata → Publicar cambios*).

### Qué hace, en orden

1. Lee las dos pestañas.
2. **Filtra `estado === "publicado"`** en ambas. Todo lo demás no existe.
3. Valida: slug presente y único, nombre presente, `artista_slug` de cada obra
   existe en la lista de artistas. Si algo falla, **aborta y muestra qué fila**
   — nunca publiques a medias.
4. Agrupa las obras bajo su artista (el join 1-a-muchos).
5. Arma el objeto con la forma exacta de §3, **descartando las columnas
   internas** (`email`, `precio`, `en_venta`, `foto_drive`, `estado`).
6. Serializa a `window.FRAGATA_ARTISTS = [...];` con un encabezado de aviso.
7. Commitea `js/data.js` al repo vía API de GitHub.

```js
// Boceto del paso 7 — el resto es manipulación de arrays
function commitDataJs(contenido) {
  const repo  = 'colo03/fragataWEB';
  const path  = 'js/data.js';
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const url   = `https://api.github.com/repos/${repo}/contents/${path}`;
  const head  = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };

  // Hace falta el sha del archivo actual para poder sobrescribirlo
  const actual = JSON.parse(UrlFetchApp.fetch(url, { headers: head }).getContentText());

  UrlFetchApp.fetch(url, {
    method: 'put',
    headers: head,
    contentType: 'application/json',
    payload: JSON.stringify({
      message: `Actualizar contenido — ${new Date().toISOString()}`,
      content: Utilities.base64Encode(contenido, Utilities.Charset.UTF_8),
      sha: actual.sha,
    }),
  });
}
```

### Antes de escribir el script

- [ ] Crear un **fine-grained PAT** en GitHub con permiso de escritura de
      contenido **solo sobre este repo**.
- [ ] Guardarlo en *Configuración del proyecto → Propiedades del script*,
      **nunca dentro del código** (el código del Apps Script lo puede ver
      cualquiera con acceso de edición a la hoja).
- [ ] Ponerle vencimiento y anotar cuándo hay que renovarlo.

### Encabezado obligatorio del archivo generado

```js
/* ARCHIVO GENERADO — NO EDITAR A MANO.
   Se sobrescribe con Fragata → Publicar cambios.
   Editá el contenido en la hoja: <link al Sheet> */
```

Sin esto, alguien va a corregir un typo acá y lo va a perder en la publicación
siguiente.

---

## 7. Fase 3 — Imágenes

**Google Drive no sirve para servir imágenes en producción.** Rate-limita, no
redimensiona y las URLs cambian de formato cada tanto.

Las fotos que suben por Forms caen en una carpeta de Drive del dueño del
formulario. De ahí hay que sacarlas. Dos opciones:

### A. Commitear al repo (más simple)

Bajar la imagen, redimensionar, guardarla en `assets/artistas/` o `assets/obras/`
y commitearla junto con `data.js`. `foto_final` guarda la ruta relativa.

Sirve mientras el catálogo sea chico. Ojo: el repo crece y no hay vuelta atrás
fácil, las imágenes quedan en el historial de git para siempre.

### B. Cloudinary (mejor a mediano plazo)

El plan gratis alcanza de sobra. Da resize y formato automáticos por URL, que
para una galería con fotos pesadas es la diferencia entre cargar en 1s o en 8s.
`foto_final` guarda la URL completa.

**Empezá por A si querés salir rápido, pasá a B antes de la segunda muestra.**
El cambio no toca el frontend: `photo` es una string, le da igual si es ruta
relativa o URL absoluta.

- [ ] Configurar los permisos de la carpeta de Drive como "cualquiera con el
      link puede ver", si no el script no la puede descargar.
- [ ] Definir tamaño máximo y formato (sugerencia: 1600px de lado mayor, WebP).

---

## 8. Hosting y dominio propio

**Usar `galeriafragata.com` no implica dejar GitHub ni cambiar nada del flujo.**
El repositorio sigue siendo la fuente de verdad, los commits siguen ahí, y el
generador del §6 no se toca. Lo único que cambia es qué servidor responde cuando
alguien escribe el dominio en el navegador.

Un dominio son dos cosas separadas: **el nombre** (se compra una vez por año) y
**dónde apunta** (configuración DNS). Comprarlo no te ata a ningún hosting.

### Las tres formas de hacerlo

| Opción | Cómo publica | Repo privado | Costo |
|---|---|---|---|
| **GitHub Pages** | Commit → publica solo | Requiere plan pago | Gratis |
| **Netlify / Vercel** | Commit → publica solo | Sí, gratis | Gratis |
| **Hosting tradicional** | Subida por FTP, a mano | — | ~USD 3-10/mes |

Las dos primeras se conectan al repo y republican solas con cada commit. Es
decir: el Apps Script commitea `data.js` y el sitio se actualiza sin que nadie
toque nada. **La tercera rompe eso**: alguien tendría que bajar los archivos y
subirlos por FTP cada vez que se carga un artista. No hay ninguna razón para
elegirla en un sitio estático.

### Recomendación: Netlify

Sobre GitHub Pages, gana en tres cosas concretas para este caso:

1. **Funciona con repo privado en el plan gratis.** GitHub Pages exige repo
   público salvo que pagues Pro. Como la hoja tiene emails y precios, y el
   generador filtra esas columnas, tener el repo privado es una red de seguridad
   barata por si algo se filtra al `data.js` por error.
2. **Netlify Forms resuelve el bloqueante del §4.** Le agregás un atributo al
   `<form>` y los envíos te llegan por mail, sin backend ni servicio aparte. El
   plan gratis cubre 100 envíos por mes, de sobra para consultas por obra.
3. **Invalida la caché en cada deploy.** Con Pages a veces hay que esperar o
   forzar recarga para ver un cambio de CSS; acá no.

Vercel es equivalente salvo por el punto 2 (no tiene formularios propios).

### Pasos, cuando tengas el dominio

- [ ] Comprar `galeriafragata.com` (Namecheap, Cloudflare o cualquier registrador).
- [ ] Conectar el repo a Netlify. Sin build command; el directorio a publicar es
      la raíz del proyecto.
- [ ] Agregar el dominio en Netlify y copiar los registros DNS que indique.
- [ ] Cargarlos en el panel del registrador. **La propagación tarda de minutos a
      48 horas**; no lo dejes para el día del lanzamiento.
- [ ] Verificar que el HTTPS quede activo (es automático y gratis, vía Let's
      Encrypt) y que `www` redirija al dominio sin `www`, o al revés — pero que
      una de las dos formas redirija a la otra, no que las dos sirvan el sitio.

### Un detalle que sí hay que revisar

Todas las rutas del sitio son relativas (`css/styles.css`, `artista.html?slug=`),
así que **no hay que tocar nada del código al cambiar de dominio**. Lo único a
actualizar son las URLs absolutas de las meta tags de Open Graph cuando se
agregue la `og:image` del §4.

---

## 9. Qué queda afuera de este plan

**Eventos.** `eventos.html` está hardcodeado y no lee `data.js`. El documento
original menciona eventos en el diagrama de flujo pero **nunca define sus
campos**. Sumarlo implica: definir el formulario, agregar `window.FRAGATA_EVENTS`,
y reescribir `eventos.html` como plantilla igual que se hizo con artistas.
Es el mismo trabajo ya hecho dos veces, así que es predecible — pero no está
hecho.

**Edición de contenido ya cargado.** Forms solo sabe agregar filas. Corregir la
bio de un artista se hace editando la celda en la hoja, a mano. Está bien; solo
hay que saberlo y contárselo a quien vaya a cargar contenido.

**Borrar contenido.** Poner `estado` en cualquier cosa distinta de `publicado`
lo saca del sitio en la próxima publicación. No borres filas: perdés el slug y
el historial.

---

## 10. Migración futura a un almacenamiento real

El día que Sheets quede chico — varias personas cargando a la vez, cientos de
obras, o necesidad de editar desde un panel decente — el camino es Supabase
(Postgres con API REST de fábrica, storage de imágenes y auth incluidos).

**Lo bueno: casi nada de lo que hagas ahora se tira.**

| Pieza | Qué pasa en la migración |
|---|---|
| Contrato de datos (§3) | **Se conserva igual.** Es la razón de tenerlo escrito |
| `main.js`, `artista.js`, `obra.js`, `carrusel.js` | **No se tocan** |
| `css/styles.css` | No se toca |
| Generador (Apps Script) | Se reescribe: mismo output, otro origen. ~1 día |
| Hojas de Sheets | Se convierten en dos tablas con las mismas columnas |
| `slug` | **Se conserva** — por eso importa que sea estable desde el día uno |

Las decisiones que hoy parecen burocráticas (slug estable, columnas con nombres
fijos, separar campos internos de públicos) son exactamente las que hacen que
esa migración sea un día de trabajo y no una reescritura.

**Cuándo migrar, en señales concretas:**

- Dos personas cargando contenido a la vez y pisándose.
- Más de ~200 obras: el generador empieza a tardar y `data.js` a pesar.
- Necesidad de que el contenido cambie sin apretar un botón.
- Querer que los artistas editen su propio perfil.

Mientras no pase ninguna, Sheets es la respuesta correcta.

---

## 11. Orden sugerido

1. **Conectar el repo a Netlify** (§8). Es media hora y a partir de ahí cada
   commit se ve publicado — trabajás contra el sitio real, no contra tu máquina.
2. **Fase 0** — bloqueantes (§4). Sobre todo el formulario de consulta, que si
   elegiste Netlify se resuelve en el mismo paso.
3. **Comprar el dominio y apuntarlo** (§8). Cuanto antes, por la propagación DNS.
4. **Fase 1** — armar las hojas y los dos Forms (§5).
5. Cargar **dos artistas reales de punta a punta**, a mano en la hoja. Sirve para
   validar el contrato antes de automatizar nada.
6. **Fase 2** — el generador (§6).
7. **Fase 3** — imágenes (§7).
8. Reemplazar los 8 artistas de ejemplo por los reales y publicar.

El paso 3 parece opcional y no lo es: es mucho más barato descubrir que falta
una columna con dos artistas cargados a mano que con el script ya escrito.

---

## Decisiones pendientes

- ¿El repo va a ser público o privado? Si va a ser privado, GitHub Pages queda
  descartado salvo que se pague Pro — ver §8.
- ¿Los precios se muestran en el sitio o solo alimentan la consulta?
- ¿Una obra puede tener varias fotos? Hoy `data.js` soporta una sola; el
  documento original pedía "imagen(es)" en plural.
- ¿Quién carga contenido? Si son los propios artistas, el Form necesita más
  validación y textos de ayuda que si lo carga el equipo.
