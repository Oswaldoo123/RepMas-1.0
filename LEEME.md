# RepMás — Progresión de cargas

Aplicación web instalable (PWA), gratuita y sin registro, pensada para entrenamientos de fuerza e hipertrofia.

## Qué incluye

- Cinco rutinas iniciales: Push, Pull, Legs, Upper y Lower, todas editables. Puedes crear más.
- Más de 30 ejercicios de ejemplo y opción de añadir los tuyos.
- Configuración individual del rango de repeticiones, RIR e incremento de peso.
- Registro de varias series por ejercicio (peso, repeticiones y RIR opcional).
- Recomendación **por serie** para subir, mantener o bajar la carga en la siguiente sesión.
- Historial de sesiones y gráfica del peso máximo registrado por ejercicio.
- Guardado local y automático mientras entrenas, y respaldos exportables/importables como JSON.
- Sin anuncios, sin cuentas y sin suscripciones. Funciona sin conexión después de instalarse y cargar sus archivos por primera vez.

## Regla de recomendaciones

Se evalúa cada serie de forma independiente para permitir una serie pesada y otras de menor peso:

- **Subir**: la serie alcanzó el máximo de repeticiones configurado y, si se registró el RIR, también respetó el RIR objetivo. Sube un incremento configurado.
- **Mantener**: en el resto de los casos habituales. Procura aumentar repeticiones con buena técnica.
- **Bajar**: la misma serie quedó por debajo del mínimo de repeticiones en dos sesiones consecutivas. Baja un incremento configurado, sin pasar de cero.

La carga sugerida es orientativa; no reemplaza la valoración personal sobre fatiga, técnica, molestias o recuperación. El peso se expresa en kilogramos. En ejercicios de peso corporal puedes registrar **0 kg** (peso adicional), con tus repeticiones.

## Publicarla gratis mediante GitHub Pages

1. Entra en https://github.com y accede a tu cuenta.
2. Pulsa el botón **New repository** (o `+` → `New repository`).
3. Asigna el nombre `repmas`. Selecciona **Public** y crea el repositorio.
4. Abre ese repositorio y usa **Add file** → **Upload files**.
5. Sube **el contenido** de esta carpeta (no subas solamente el archivo ZIP): `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js` y la carpeta `icons` con sus imágenes. Los archivos principales deben quedar en la raíz del repositorio; las imágenes deben quedar en `/icons/`.
6. Confirma con **Commit changes**.
7. Abre **Settings** → **Pages**. En **Build and deployment**, elige **Deploy from a branch**, rama **main** y carpeta **/(root)**. Guarda con **Save**.
8. Espera unos minutos. La URL de tu app será similar a `https://TU-USUARIO.github.io/repmas/` (cambia `TU-USUARIO` por tu cuenta). Comprueba el enlace mostrado en la sección Pages.

### Instalar en iPhone

- Abre **la dirección de GitHub Pages** en **Safari** (no abras el ZIP desde Archivos).
- Toca **Compartir** (cuadrado con flecha).
- Desplázate a **Añadir a pantalla de inicio** y selecciona **Añadir**. Dependiendo de la versión de iOS, puede aparecer primero **Abrir como app web**.
- El icono RepMás aparecerá en tu pantalla de inicio. Ábrelo desde ahí.

### Instalar en Android

- Abre la web publicada en **Chrome**.
- Menú **⋮** → **Instalar aplicación** o **Añadir a pantalla principal**.

## Cómo probarla

1. Abre **Entrenar** y elige Push, Pull, Legs, Upper o Lower.
2. En **Editar rutina** selecciona los ejercicios que haces de verdad.
3. En **Ejercicios** cambia los rangos y los incrementos si necesitas.
4. Comienza la sesión, introduce los pesos y repeticiones de las series y guarda el entrenamiento.
5. Vuelve a entrenar ese mismo ejercicio: verás una recomendación basada en la sesión previa.
6. Consulta **Progreso** para ver el historial y la gráfica.
7. En **Ajustes** exporta un respaldo de vez en cuando.

## Privacidad y precauciones

Los datos se guardan en `localStorage` del navegador/aplicación de ese dispositivo. **No se sincronizan automáticamente** entre iPhone, Android y computadora. Borrar los datos del navegador o de la app puede borrar el historial. Exporta un respaldo antes de borrar, reinstalar o cambiar de teléfono. La importación reemplaza el contenido actual.

El primer acceso necesita internet para cargar los archivos desde GitHub Pages. Después, un service worker permite abrir las pantallas principales sin internet siempre que se hayan guardado en caché. Para distribuir una actualización, modifica la versión `CACHE` en `sw.js` al publicar cambios.

## Archivos

- `index.html`: interfaz base
- `styles.css`: estilos
- `app.js`: lógica y almacenamiento
- `manifest.json`: datos de instalación
- `sw.js`: caché para funcionamiento sin conexión
- `icons/`: iconos de iOS y Android

No hay npm, backend, bases de datos ni dependencias externas. Se puede editar todo con un editor de texto.
