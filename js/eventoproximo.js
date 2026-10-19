/* =====================================================================
   GALERÍA FRAGATA — eventoproximo.js
   Lógica exclusiva de la landing de la próxima edición:
     1) Cuenta regresiva hasta data-event-date (urgencia/conversión).
     2) Formulario de inscripción: valida en el cliente y muestra un
        estado de éxito. No hay backend acá — conectar a donde
        corresponda (Formspree, un endpoint propio, etc.) reemplazando
        el bloque marcado más abajo.

   Corre ANTES que main.js, igual que el resto de los scripts de página
   del sitio (artista.js, obra.js, artistas-marquee.js).
   ===================================================================== */

(function () {
  "use strict";

  /* -------------------- Cuenta regresiva -------------------- */
  const countdownEl = document.getElementById("eventCountdown");

  if (countdownEl) {
    const targetDate = new Date(countdownEl.dataset.eventDate);
    const els = {
      days: document.getElementById("cdDays"),
      hours: document.getElementById("cdHours"),
      minutes: document.getElementById("cdMinutes"),
      seconds: document.getElementById("cdSeconds"),
    };

    const pad = (n) => String(n).padStart(2, "0");

    const render = () => {
      const diff = targetDate.getTime() - Date.now();

      // El evento ya pasó (o la fecha vino mal cargada): se oculta la
      // cuenta regresiva en vez de mostrar números negativos.
      if (!Number.isFinite(diff) || diff <= 0) {
        countdownEl.hidden = true;
        clearInterval(timerId);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      els.days.textContent = pad(days);
      els.hours.textContent = pad(hours);
      els.minutes.textContent = pad(minutes);
      els.seconds.textContent = pad(seconds);
    };

    render();
    const timerId = setInterval(render, 1000);
  }

  /* -------------------- Formulario de inscripción -------------------- */
  const form = document.getElementById("signupForm");
  const successEl = document.getElementById("signupSuccess");
  const roleSelect = document.getElementById("signupRole");
  const artistFieldWrap = document.getElementById("signupArtistFieldWrap");

  // Si elige "quiero exponer", aparece el campo extra para contar la obra.
  if (roleSelect && artistFieldWrap) {
    roleSelect.addEventListener("change", () => {
      artistFieldWrap.hidden = roleSelect.value !== "artista";
    });
  }

  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      // ------------------------------------------------------------------
      // Acá va la integración real (fetch a un endpoint, Formspree, etc.).
      // Se deja sólo un log para no depender de ningún backend en el
      // template base:
      //   fetch("https://tu-endpoint/inscripciones", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(payload),
      //   });
      // ------------------------------------------------------------------
      console.info("[Fragata] Inscripción recibida:", payload);

      form.hidden = true;
      if (successEl) successEl.hidden = false;
    });
  }
})();