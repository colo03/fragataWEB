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
  plan salvo que se decida sumarlo (ver §9).
- **Ninguna foto es real.** Todo el sitio muestra placeholders rayados.
- **Los formularios no envían nada.** Ver §4, son bloqueantes.

---

## 2. La arquitectura elegida

```
Google Form  ──►  Google Sheets  ──►  Apps Script  ──►  data.js  ──►  Netlify
  (carga)          (base de datos)    (botón Publicar)   (commit)      (build + sitio vivo)
                                            │
                                            └──►  Cloudinary (fotos)
```

**El sitio nunca le habla a Google.** El script lee la hoja, sube las fotos
nuevas a Cloudinary, arma el archivo y lo commitea. Netlify detecta el commit,
corre el build (§8) y publica. El visitante recibe HTML y JS estáticos.

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

> **Ojo: hoy `js/data.js` no es solo datos.** Además de `FRAGATA_ARTISTS`,
> tiene el bloque `window.FRAGATA` con los helpers que usa todo el sitio
> (`getArtist`, `getWork`, `getParam`, `escape`, `media`, `workUrl`,
> `workCard`). El generador sobrescribe el archivo entero, así que **la primera
> publicación los borraría** y las páginas de artista y de obra dejarían de
> funcionar. Antes de escribir el generador, hay que mover ese bloque a
> `js/fragata.js` y cargarlo en `index.html`, `artista.html` y `obra.html`
> justo después de `data.js`. Desde ahí, `data.js` contiene solo datos.

```js
window.FRAGATA_ARTISTS = [
  {
    slug:       "ana-perez",        // único, estable, [a-z0-9-]
    name:       "Ana Pérez",
    discipline: "Pintura",          // categórico — ver aviso abajo
    photo:      "https://res.cloudinary.com/.../artistas/ana-perez.jpg",  // o null — ver §7
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
        photo:     "https://res.cloudinary.com/.../obras/serenidad-cosmica.jpg",  // o null
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
| Build de páginas (§8) | `slug`, `name`, `discipline`, `photo`, `bio[0]`; por obra `slug`, `title`, `photo`, `desc` |

---

## 4. Fase 0 — Bloqueantes antes de salir

Nada de esto depende de Sheets. Se puede hacer en paralelo.

- [ ] **Conectar el formulario "Me interesa esta obra".** Hoy simula el éxito:
      muestra "¡Gracias! ✓" y no le llega a nadie. Está marcado con un TODO en
      `js/main.js`. Alguien deja sus datos creyendo que consultó por una obra y
      ese mensaje se pierde. **Es el bloqueante más serio: no salgas sin esto.**
      Con Netlify Forms se resuelve en una tarde, pero no alcanza con el
      atributo: ver "Cómo conectar los formularios" en el §8.
- [ ] **Conectar el formulario de newsletter** del index (`onsubmit="return false"`
      y otro `preventDefault` con éxito simulado en `main.js`).
- [x] **Separar los helpers de `data.js`** a `js/fragata.js` (ver aviso del §3).
      Es mover un bloque y agregar un `<script>` en tres páginas.
- [ ] **Reemplazar los datos de contacto.** `[correo@fragata.com]` y `[+54 9 ...]`
      aparecen literales en el footer de las cuatro páginas.
- [ ] **Escribir el "Nosotros"** del index (hoy `[Placeholder]`).
- [ ] **Links reales de redes** (hoy todos `href="#"`).
- [ ] **Foto y descripción para Open Graph del home.** Sin `og:image`, compartir
      el sitio por WhatsApp muestra una tarjeta vacía.
- [ ] **Vista previa propia para cada artista y cada obra.** Es el punto que
      más pesa de esta lista, porque una galería se difunde compartiendo links
      de artistas y obras. Hoy `artista.html?slug=...` arma el contenido con JS,
      y WhatsApp, Instagram y Facebook **no ejecutan JS** al generar la vista
      previa: todos los links muestran la misma tarjeta genérica. Se resuelve
      con el build de páginas del §8.
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
| `foto_final` | script | URL de Cloudinary; la escribe el generador (ver §7) |
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
| `foto_final` | script | ver §7 |
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
4. Sube a Cloudinary las fotos de las filas que tienen `foto_drive` y todavía
   no tienen `foto_final`, y escribe la URL resultante en `foto_final` (§7).
5. Agrupa las obras bajo su artista (el join 1-a-muchos).
6. Arma el objeto con la forma exacta de §3, **descartando las columnas
   internas** (`email`, `precio`, `en_venta`, `foto_drive`, `estado`).
7. Serializa a `window.FRAGATA_ARTISTS = [...];` con un encabezado de aviso.
   Nada más: los helpers viven en `js/fragata.js` (ver aviso del §3).
8. Commitea `js/data.js` al repo vía API de GitHub. Cada publicación es un
   deploy a producción en Netlify y consume créditos (§8).

```js
// Boceto del paso 8 — el resto es manipulación de arrays.
// Falta el manejo de errores: ver "Riesgos del token" más abajo.
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

- [ ] Crear un **fine-grained PAT** en GitHub con permiso *Contents: read and
      write* **solo sobre este repo**, y ningún otro permiso.
- [ ] Guardarlo en *Configuración del proyecto → Propiedades del script*,
      **nunca dentro del código**. Lo mismo para el API secret de Cloudinary.
- [ ] Ponerle vencimiento (máximo un año) y **crear un recordatorio en el
      calendario** una semana antes de que venza.

### Riesgos del token

Las Propiedades del script **no son un lugar secreto**: las protegen de quien
lee el código, pero no de quien edita la hoja. Un Apps Script vinculado a una
hoja lo puede abrir cualquier editor de esa hoja, y desde ahí ve las
propiedades. En la práctica:

- **Todo editor de la hoja tiene permiso de escritura sobre el repo.** No solo
  sobre `data.js`: con ese token se puede commitear cualquier archivo, incluido
  JS que se ejecuta en el sitio. Con el secret de Cloudinary, además, puede
  subir o borrar fotos.
- **Mantené la lista de editores corta**: solo quienes curan y publican. Quien
  carga artistas u obras lo hace por los Forms, que no requieren acceso a la
  hoja. Si alguien deja el equipo, sacalo de la hoja **y rotá el token**.
- **El vencimiento rompe el botón.** El día que el token vence, *Publicar
  cambios* deja de funcionar. Por eso, el script tiene que revisar la respuesta
  de cada llamada a GitHub y mostrar un mensaje que se entienda, no un stack
  trace:
  - `401` → "El token de GitHub venció o fue revocado. Hay que generar uno
    nuevo y pegarlo en Propiedades del script."
  - `403` / `404` → "El token no tiene permiso sobre el repo."
  - `409` → "`data.js` cambió mientras se publicaba. Volvé a apretar Publicar."

  `UrlFetchApp.fetch` tira una excepción ante cualquier error, salvo que se le
  pase `muteHttpExceptions: true`. Pasáselo y revisá `getResponseCode()`.

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
formulario. De ahí hay que sacarlas.

### Cloudinary desde el día uno

Una versión anterior de este documento proponía empezar commiteando las fotos
al repo y pasar a Cloudinary más adelante. **Se descartó:** commitear parece lo
más simple, pero no lo es.

- **Apps Script no sabe redimensionar imágenes.** Una foto de celular de 5 MB
  terminaría en el repo tal cual, o alguien tendría que achicarla a mano antes.
- **El repo crece para siempre.** Las imágenes quedan en el historial de git
  aunque después se borren.
- **Netlify cobra el tráfico en créditos (§8).** Una galería es casi todo
  fotos. Si las sirve Netlify, el plan gratis se agota mucho antes.

Cloudinary resuelve las tres cosas y es **menos** trabajo que commitear. Las
transformaciones van en la URL, así que no hay que procesar nada.

### Cómo lo hace el generador (paso 4 del §6)

Para cada fila con `foto_drive` y sin `foto_final`:

1. Toma el ID del archivo del link de Drive y lo lee con
   `DriveApp.getFileById(id).getBlob()`. El script corre con la cuenta de quien
   aprieta Publicar, así que **la carpeta no hace falta hacerla pública**:
   alcanza con compartirla con quienes publican.
2. Lo sube a la API de upload de Cloudinary como data URI en base64, con
   `public_id` = `artistas/<slug>` u `obras/<slug>`. Así la foto queda atada al
   slug y no se duplica si se vuelve a subir. Mandá `overwrite=true` e
   `invalidate=true`: si no, al reemplazar una foto la CDN sigue sirviendo la
   anterior.
3. Guarda en `foto_final` la URL de entrega con la transformación incluida:
   `https://res.cloudinary.com/<cuenta>/image/upload/f_auto,q_auto,c_limit,w_1600/obras/<slug>`.
   `f_auto` entrega WebP o AVIF según el navegador, y `w_1600` limita el lado
   mayor.
4. Si una subida falla, **aborta y muestra la fila**, igual que la validación
   del paso 3.

**Ojo con el límite de tiempo.** Apps Script corta cualquier ejecución a los
**6 minutos**, sin mostrar ningún mensaje propio. La carga inicial (decenas de
fotos, varios segundos cada una) puede pasarse de ese límite. Por eso:

- Escribir `foto_final` **apenas termina cada subida**, no todas juntas al
  final. Así, si la ejecución se corta, volver a apretar Publicar sigue desde
  donde quedó y no repite nada.
- Medir el tiempo transcurrido y **cortar a propósito cerca de los 5 minutos**,
  sin commitear, con un mensaje del tipo "Se subieron N fotos, quedan M. Apretá
  Publicar de nuevo." El commit de `data.js` sale recién en la corrida que
  termina todas las fotos.

Como `foto_final` queda escrita, cada foto se sube una sola vez. Para
reemplazar una foto: borrar `foto_final`, cambiar `foto_drive` y publicar.

El frontend no se entera: `photo` es una string, le da igual de dónde venga.

### Antes de escribir esta parte

- [ ] Crear la cuenta de Cloudinary. Al momento de escribir esto, el plan gratis
      da 25 créditos por mes. Un crédito equivale aproximadamente a 1 GB de
      tráfico, 1 GB de almacenamiento o 1000 transformaciones. Alcanza de sobra
      para arrancar.
- [ ] Guardar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y
      `CLOUDINARY_API_SECRET` en Propiedades del script. Firmar las subidas con
      el secret (SHA-1 con `Utilities.computeDigest`); **no usar un upload
      preset unsigned**, porque cualquiera que lo conozca puede subir archivos a
      la cuenta.
- [ ] Confirmar en la página de precios el tamaño máximo por imagen del plan
      gratis. La información pública habla de **10 MB y 25 MP**, pero sale de
      una tabla sin fecha y de un post de soporte viejo. Avisar ese límite en la
      descripción de la pregunta de foto en los Forms. Si una foto lo supera,
      el script tiene que decir qué fila es.
- [ ] Compartir la carpeta de subidas de los Forms con todas las personas que
      publican.

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
| **Netlify / Vercel** | Commit → publica solo | Sí, gratis | Gratis con límites (ver abajo) |
| **Hosting tradicional** | Subida por FTP, a mano | — | ~USD 3-10/mes |

Las dos primeras se conectan al repo y republican solas con cada commit. Es
decir: el Apps Script commitea `data.js` y el sitio se actualiza sin que nadie
toque nada. **La tercera rompe eso**: alguien tendría que bajar los archivos y
subirlos por FTP cada vez que se carga un artista. No hay ninguna razón para
elegirla en un sitio estático.

### Recomendación: Netlify

Sobre GitHub Pages, gana en cuatro cosas concretas para este caso:

1. **Funciona con repo privado en el plan gratis.** GitHub Pages exige repo
   público salvo que pagues Pro. Como la hoja tiene emails y precios, y el
   generador filtra esas columnas, tener el repo privado es una red de seguridad
   barata por si algo se filtra al `data.js` por error.
2. **Netlify Forms resuelve el bloqueante del §4**, sin backend ni servicio
   aparte: los envíos llegan por mail. Según la información pública de 2026,
   ya no consumen créditos. Confirmalo en la página de precios antes de
   depender de eso. Ver abajo "Cómo conectar los formularios": hace falta algo
   más que el atributo.
3. **Corre el build de páginas** (ver abajo) en cada deploy, sin configurar
   nada aparte de un comando.
4. **Invalida la caché en cada deploy.** Con Pages a veces hay que esperar o
   forzar recarga para ver un cambio de CSS; acá no.

Vercel es equivalente salvo por el punto 2 (no tiene formularios propios).

### Ojo: el plan gratis de Netlify funciona por créditos

Las cuentas creadas desde septiembre de 2025 no tienen el plan gratis viejo
(100 GB de tráfico, 300 minutos de build). Tienen **300 créditos por mes**:

- **Cada deploy a producción exitoso cuesta 15 créditos**, sin importar cuánto
  dure el build. Cuentan todos: cada *Publicar cambios* del Apps Script y cada
  push a `main`.
- **El tráfico y las requests también consumen créditos**, y salen de la misma
  bolsa de 300. Las páginas oficiales de Netlify no coinciden en las tarifas
  (entre 10 y 20 créditos por GB, y entre 2 y 3 por cada 10.000 requests);
  confirmalas antes de hacer cuentas finas.
- **300 / 15 = 20 deploys es el techo con cero visitas**, no una cifra
  realista. Con tráfico real, contá con bastante menos: unos 10-15 deploys a
  producción por mes es una referencia prudente para arrancar.
- **Si se acaban los créditos, el sitio se pausa** hasta el ciclo siguiente.
  Que una galería quede fuera de línea a mitad de mes es justo lo que no puede
  pasar.
- Según la documentación oficial, los deploy previews, los deploys de ramas,
  los deploys fallidos y los rollbacks **no** consumen créditos.

Reglas que salen de esto:

- [ ] **No se desarrolla sobre `main`.** Se trabaja en ramas o PRs (cada una
      tiene su preview gratis) y se mergea a `main` cuando hay algo para salir.
- [ ] **Publicar desde la hoja por tandas**, no cada vez que se corrige un typo.
- [ ] **Las fotos salen de Cloudinary, nunca de Netlify** (§7). Así el tráfico
      que pasa por Netlify es solo HTML, CSS y JS, apenas unos KB por visita.
- [ ] Activar las notificaciones de uso en el panel de Netlify.

### Cómo conectar los formularios

Agregar `data-netlify="true"` al `<form>` **no alcanza** con el código actual.
`main.js` intercepta el envío con `e.preventDefault()` y muestra "¡Gracias!"
sin mandar nada (el TODO de la consulta por obra y el del newsletter). Con
solo el atributo, el envío nunca sale y las consultas se siguen perdiendo.

- [ ] Ponerle `name` y `data-netlify="true"` a cada `<form>` en el HTML
      estático (`interest-obra` y `newsletter`). Netlify detecta los
      formularios leyendo el HTML durante el deploy; un form armado por JS no
      lo ve.
- [ ] Agregar `<input type="hidden" name="form-name" value="interest-obra">`
      (y lo mismo para el newsletter).
- [ ] Reemplazar el TODO de `main.js` por un `fetch` POST a `/` con
      `Content-Type: application/x-www-form-urlencoded` y el cuerpo
      `new URLSearchParams(new FormData(formEl))`.
- [ ] Mostrar "¡Gracias!" **solo si la respuesta es OK**. Si falla, mostrar un
      error y dejar el formulario con los datos cargados para reintentar.
- Los campos ocultos `obra` y `artista` ya existen en `obra.html` y `obra.js`
  los completa, así que cada consulta llega diciendo por qué obra es.
- [ ] Probar con un envío real en un deploy preview y confirmar que llega el
      mail antes de lanzar.

**Plan B: Cloudflare Pages.** Tráfico ilimitado y 500 builds por mes en el plan
gratis, y conecta repos privados. No tiene formularios propios: habría que
sumar Formspree o Web3Forms para el §4. Si con el uso real los créditos de
Netlify quedan justos, migrar es corto: el build del apartado siguiente es el
mismo, y solo cambia dónde se configura.

### El build: una página por artista y por obra

Resuelve el bloqueante de vista previa del §4. Los scrapers de WhatsApp,
Instagram y Facebook leen el HTML **tal cual llega**: no ejecutan `artista.js`.
Por eso todas las páginas de artista y de obra muestran hoy la misma tarjeta
genérica ("Artista — Galería Fragata"). Para que cada link tenga su foto y su
nombre, las meta tags tienen que estar escritas en el HTML antes de que llegue
al navegador.

Un script de Node chico (~50-80 líneas, `scripts/build-paginas.js`, sin
dependencias) que Netlify corre en cada deploy:

1. Copia a `dist/` **solo lo público**: los `.html` del sitio, `css/`, `js/` y
   `assets/`. Nada de `docs/`, `README.md`, el PDF ni `scripts/`: Netlify
   publica todo lo que haya en el directorio, y
   `galeriafragata.com/docs/handoff-produccion.md` quedaría a la vista.
2. Carga `js/data.js` con `vm.runInNewContext` (pasándole un `window` vacío) y
   lee `FRAGATA_ARTISTS`. **El contrato del §3 no cambia y el Apps Script
   tampoco**: sigue commiteando solo `data.js`.
3. Por cada artista escribe `dist/artistas/<slug>/index.html`, a partir de
   `artista.html` con estas meta tags completadas:
   - `<title>` y `og:title` → nombre del artista
   - `og:description` → `discipline` + inicio de `bio[0]`
   - `og:image` → `photo` con transformación de Cloudinary para tarjeta:
     `c_fill,w_1200,h_630`
   - `og:url` y `<link rel="canonical">` → URL absoluta. Netlify expone el
     dominio en la variable de entorno `URL`.
4. Igual para cada obra en `dist/obras/<artista>/<obra>/index.html`, a partir
   de `obra.html`.
5. **Campos vacíos:** el contrato permite `photo: null`, y al principio casi
   ningún artista va a tener foto. Sin foto, usar la `og:image` del home; si
   no, la tarjeta sale rota (`og:image="null"`). Sin `bio`, la descripción es
   solo la disciplina; nunca concatenar `undefined`.

Lo que hay que ajustar en el código para que esto funcione:

- [ ] **Rutas absolutas en los HTML** (`/css/styles.css`, `/js/data.js`,
      `/assets/...`). Una página en `/artistas/ana-perez/` no encuentra
      `css/styles.css` relativo. Sigue funcionando con
      `python -m http.server` servido desde la raíz.
- [ ] **Leer el slug también de la página generada.** El build escribe
      `<body data-slug="..." data-artista="...">`, y `getParam` (en
      `js/fragata.js`, ver §3) devuelve el parámetro de la URL o, si no está,
      el `data-*` del body. Es un cambio en un solo lugar, compartido por
      `artista.js` y `obra.js`.
- [ ] **Los links internos pasan al formato nuevo** (`/artistas/<slug>/` y
      `/obras/<artista>/<obra>/`). Son tres lugares: la grilla del index
      (`main.js`), el link al artista en `obra.js` y `workUrl` en
      `js/fragata.js`, que usan los carruseles.
- [ ] **Redirigir el formato viejo al nuevo.** En `_redirects`:

      ```
      /artista.html  slug=:slug                  /artistas/:slug/         301!
      /obra.html     slug=:slug artista=:artista /obras/:artista/:slug/   301!
      ```

      El `!` es obligatorio: por default Netlify **no** aplica una redirección
      si existe un archivo en esa ruta (lo llama *shadowing*), y `artista.html`
      y `obra.html` siguen existiendo en `dist/`. Sin el `!` la regla nunca se
      dispara. Probarlo en un deploy preview con un link viejo.
- [x] Agregar `dist/` al `.gitignore`.

### Estado del build (octubre 2026)

Ya está en el repo la **primera parte** del build, sin la generación de
páginas por artista y obra:

- [`scripts/build-paginas.js`](../scripts/build-paginas.js) arma `dist/` con
  lo público (punto 1 de arriba), carga `data.js` con `vm` y **valida el
  contrato del §3**: slugs válidos y únicos, `name`, `discipline`, `bio` como
  array, `works` como array, `title` en cada obra. Si algo falla, sale con
  código 1 y Netlify no publica. También avisa (sin frenar) de `href`/`src`
  locales que apuntan a archivos inexistentes.
- [`netlify.toml`](../netlify.toml) configura build command, `publish = "dist"`,
  `NODE_VERSION = "20"` y headers básicos de seguridad.

**El script nunca se corrió.** Se escribió en una máquina sin Node. Antes de
seguir, desde una computadora con Node 18+:

- [ ] Correr `node scripts/build-paginas.js` desde la raíz y confirmar que
      termina con `✓ dist/ listo: ...`.
- [ ] Servir `dist/` (`python -m http.server -d dist`) y recorrer las páginas.
- [ ] Revisar los avisos de referencias rotas. Al escribir esto ya se sabe de
      tres archivos que los HTML cargan pero **no están en el repo**:
      `css/artistas.css` y `js/artistas-marquee.js` (en `artistas.html`) y
      `css/eventos-detalle.css` (en `evento.html` y `eventoproximo.html`).
      Probablemente quedaron sin commitear en la máquina de quien hizo esas
      páginas. Online van a dar 404.

**Siguiente paso del build:** la generación de páginas (puntos 2 a 5 de arriba)
y los ajustes de código de la lista. El script tiene marcado dónde va.

**En el panel de Netlify** (requiere la cuenta, no se hace desde el código):

- [ ] *Add new site → Import from Git* con `colo03/fragataWEB`. Build command
      y directorio salen solos del `netlify.toml`.
- [ ] *Site configuration → Forms*: activar la detección de formularios. Sin
      eso, los envíos no llegan aunque el HTML esté bien.
- [ ] Probar el formulario de consulta en el deploy preview del PR y confirmar
      que llega el mail.

Si en algún momento el build falla, Netlify no publica, el sitio anterior sigue
online y el intento fallido no consume créditos. El build tiene que **fallar a
propósito** si `data.js` no carga o le falta un slug, en lugar de publicar
páginas vacías.

### Pasos, cuando tengas el dominio

- [ ] Comprar `galeriafragata.com` (Namecheap, Cloudflare o cualquier registrador).
- [ ] Conectar el repo a Netlify. Build command `node scripts/build-paginas.js`,
      directorio a publicar `dist`. Mientras el build no exista: sin build
      command y publicando la raíz, sabiendo que `docs/` queda accesible
      públicamente hasta entonces.
- [ ] Agregar el dominio en Netlify y copiar los registros DNS que indique.
- [ ] Cargarlos en el panel del registrador. **La propagación tarda de minutos a
      48 horas**; no lo dejes para el día del lanzamiento.
- [ ] Verificar que el HTTPS quede activo (es automático y gratis, vía Let's
      Encrypt) y que `www` redirija al dominio sin `www`, o al revés — pero que
      una de las dos formas redirija a la otra, no que las dos sirvan el sitio.

### Un detalle que sí hay que revisar

Las rutas internas no dependen del dominio, así que **no hay que tocar nada del
código al cambiar de dominio**. Las URLs absolutas de Open Graph las arma el
build con la variable `URL` de Netlify. Solo hay que revisar la `og:image` del
home si se escribió a mano.

Para probar las tarjetas antes de anunciar el sitio, usá el
[Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/)
(sirve también para WhatsApp e Instagram) con la URL de un artista.

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
| `main.js`, `artista.js`, `obra.js`, `carrusel.js`, `fragata.js` | **No se tocan** |
| `css/styles.css` | No se toca |
| Build de páginas (§8) | **No se toca** — sigue leyendo el mismo `data.js` |
| Fotos en Cloudinary | Se quedan donde están; Supabase Storage es opcional |
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
   rama tiene su preview gratis: trabajás contra el sitio real, no contra tu
   máquina. Recordá que cada merge a `main` cuesta créditos.
2. **Fase 0** — bloqueantes (§4). Sobre todo el formulario de consulta, que si
   elegiste Netlify se resuelve en el mismo paso.
3. **El build de páginas** (§8): rutas absolutas, `data-slug`, script y
   redirects. Va antes de cargar contenido real, para que el primer link que se
   comparta ya tenga su tarjeta.
4. **Comprar el dominio y apuntarlo** (§8). Cuanto antes, por la propagación DNS.
5. **Fase 1** — armar las hojas y los dos Forms (§5). Crear también la cuenta de
   Cloudinary (§7).
6. Cargar **dos artistas reales de punta a punta**, a mano en la hoja. Sirve para
   validar el contrato antes de automatizar nada.
7. **Fase 2 + 3** — el generador con la subida a Cloudinary (§6 y §7). Van
   juntas porque la subida es un paso del generador.
8. Reemplazar los 8 artistas de ejemplo por los reales y publicar.

El paso 6 parece opcional y no lo es: es mucho más barato descubrir que falta
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
