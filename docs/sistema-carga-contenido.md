# Sistema de carga de contenido para la web de la galería

> Transcripción de `sistema-carga-contenido-galeria.pdf`.
> Flujo Google Form → Sheets → base de datos → frontend, y diseño de formularios.

## 1. Flujo general de datos

El Google Form no se conecta directo con la web. Los datos siempre pasan primero
por la hoja de cálculo, que funciona como bandeja de entrada, y de ahí un script
los empuja a una base de datos real que es la que finalmente alimenta el sitio.

```
Google Form            Carga de artistas, obras y eventos
      ↓
Google Sheets          Guarda cada respuesta automáticamente
      ↓
Apps Script            Se dispara al enviar el formulario
      ↓
API / backend          Valida datos y procesa imágenes
      ↓
Base de datos          Postgres, Supabase o Firestore
      ↓
Frontend de la galería Consulta la base y renderiza el sitio
```

- **Google Form:** cada persona (artista, equipo de la galería) completa un
  formulario con los campos de artista, obra o evento.
- **Google Sheets:** se completa automáticamente con cada respuesta nueva; no
  requiere configuración adicional de parte de Forms.
- **Apps Script:** un script en JavaScript corre dentro de la hoja y se dispara
  automáticamente cada vez que llega una respuesta nueva (trigger "al enviar
  formulario"). Toma la fila y hace un POST en JSON a un endpoint propio.
- **API / backend:** una función serverless (Vercel, Netlify, Supabase Edge
  Functions) o un backend simple en Node. Valida que los datos estén completos
  y, si hay fotos, las baja de Google Drive y las sube a un storage pensado para
  producción (Cloudinary, Supabase Storage, S3).
- **Base de datos:** Supabase (Postgres con API REST lista de fábrica) es la
  opción más rápida de implementar: ya incluye autenticación, storage de
  imágenes y una API sin escribir mucho backend.
- **Frontend de la galería:** el sitio (por ejemplo en Next.js) consulta la base
  de datos y renderiza artistas, obras y eventos.

### Recomendaciones

**Sumar un paso de revisión antes de publicar.** En vez de que el script inserte
directo en la tabla pública, que inserte en una tabla "pendientes" y alguien del
equipo apruebe desde un panel simple antes de que pase a la tabla que lee el
frontend. Para una galería, donde la curaduría visual importa, esto evita que
una foto mal encuadrada o un dato mal cargado salga en vivo automáticamente.

**Alternativa a futuro.** Si el volumen de contenido crece, un CMS headless
(Directus, Strapi, o incluso Notion como CMS) da lo mismo pero con mejor manejo
de imágenes y un panel de edición más cómodo que Google Sheets. Arrancar con
Forms + Sheets es igualmente razonable y mucho más rápido de poner en marcha.

## 2. Diseño del Google Form

El formulario no debe pensarse solo desde "qué le preguntamos a la gente", sino
desde "qué columna necesita la base de datos después".

### 2.1 Separar artista y obra en dos formularios

Son dos entidades con relación 1-a-muchos (un artista tiene varias obras).
Mezclar todo en un solo formulario repite la bio del artista en cada fila de
obra, lo que ensucia la base y complica actualizaciones: si el artista cambia su
bio, habría que editarla en cada fila donde aparece.

- **Formulario A — Alta de artista:** se completa una vez por artista.
- **Formulario B — Alta de obra:** se completa una vez por obra, y elige a qué
  artista pertenece.

### 2.2 Vínculo obra → artista

Google Forms no permite un desplegable dinámico que lea en tiempo real los
artistas ya cargados. Dos soluciones prácticas:

- **Simple:** en el Form de obra, un campo de lista desplegable con los nombres
  de artistas, actualizado manualmente cada vez que entra uno nuevo. Funciona
  bien si no se cargan artistas todo el tiempo.
- **Más prolijo:** al completar el Form de artista, el Apps Script genera un
  `artist_id` (slug simple, ej. `maria-lopez`) y se lo envía por mail; ese ID es
  el que se completa como texto libre en el Form de obra. Menos cómodo de usar
  pero cero mantenimiento manual.

### 2.3 Campos — Formulario Artista

| Campo | Tipo en Forms | Nota |
|---|---|---|
| Nombre completo | Respuesta corta | Obligatorio |
| Nombre artístico (si difiere) | Respuesta corta | Opcional |
| Biografía | Párrafo | Sugerir un límite (ej. 800 caracteres) en la descripción de la pregunta |
| Nacionalidad | Respuesta corta o desplegable | Desplegable si se quiere filtrar por país en el sitio |
| Foto de perfil | Carga de archivos | Ver nota de imágenes al final |
| Sitio web / Instagram | Respuesta corta | Opcional |
| Email de contacto | Respuesta corta con validación | Forms valida el formato de email de forma nativa |
| Disciplina principal | Opción múltiple | Pintura / Escultura / Fotografía / Instalación / etc. Usar opción múltiple, no texto libre, para que el dato llegue limpio |

### 2.4 Campos — Formulario Obra

| Campo | Tipo en Forms | Nota |
|---|---|---|
| Artista | Desplegable o texto | Según la solución de vínculo elegida arriba. Obligatorio |
| Título de la obra | Respuesta corta | Obligatorio |
| Año | Respuesta corta con validación numérica | Forms permite restringir la respuesta a "número" |
| Técnica / medio | Opción múltiple | Óleo, acrílico, fotografía digital, etc. |
| Dimensiones | Respuesta corta | Formato sugerido en la descripción: alto x ancho x profundidad, cm |
| Descripción / curatorial | Párrafo | Opcional |
| Imagen(es) de la obra | Carga de archivos (varios) | Ver nota de imágenes al final |
| Disponible para venta | Sí / No | Opción múltiple |
| Precio | Respuesta corta numérica | Mostrar solo si aplica, con salto de sección condicional en Forms |
| Evento / exposición asociada | Desplegable | Si la obra pertenece a una muestra puntual |

### 2.5 Notas importantes de diseño

- Usar "opción múltiple" o "desplegable" siempre que el valor sea categórico
  (técnica, disciplina, país). Con texto libre, valores como "óleo", "Oleo" y
  "oleo sobre tela" quedan como tres valores distintos en la base, y el frontend
  no puede filtrar ni agrupar bien.
- Las imágenes cargadas por Forms van a una carpeta de Google Drive del dueño
  del formulario. Hay que configurar los permisos como "cualquiera con el link
  puede ver", y lo ideal es que el backend después tome ese link y suba la
  imagen a un storage real (Cloudinary, Supabase Storage), ya que Drive no está
  pensado para servir imágenes en producción a muchos visitantes.
- Nombrar las preguntas del Form igual que las columnas que después se van a
  mapear en el backend, o anotarlo en algún lado. Conviene usar títulos de
  pregunta cortos y estables, y no modificarlos después.
- Agregar un campo oculto o automático de estado ("pendiente de revisión") que
  el backend setee por default, como lugar donde vive el paso de curaduría
  mencionado en la sección 1.
