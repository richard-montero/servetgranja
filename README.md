# SerVetGranja

App web para registrar las **visitas técnicas veterinarias** a granjas de pollos de engorde.
Desarrollado por RAMN Software.

- **Frontend:** React + TypeScript (Vite), React Router.
- **API:** Netlify Functions (`netlify/functions`), que son las únicas que se conectan a MySQL.
- **Base de datos:** MySQL remoto en RamnSoftware.com.
- **Hosting y pruebas:** Netlify. No se prueba nada en local.

## Resumen de lo acordado (Fases 1 y 2)

| Tema | Decisión |
|---|---|
| Arquitectura | Navegador → `/api/*` (Netlify Functions) → MySQL. Las variables `DB_*` solo existen en Netlify. |
| Ingreso | Por celular (`Tecnicos.TecCelular`). El celular queda recordado en el dispositivo. Si no existe, no entra. |
| Contraseña | `Tecnicos.TecPassw`, en texto plano como hoy. Se compara dentro de la función y nunca llega al navegador. Si es `123`, se obliga a cambiarla (4 a 25 caracteres, distinta de 123). |
| Lista | Crías con `CrEstado = 0` autorizadas en `TecCriaAuth`, agrupadas por Empresa – Granja. |
| Técnico | Fijo: el que ingresó. Sin lista desplegable. La empresa del técnico sí se puede editar. |
| Fecha | Obligatoria, igual o posterior a `CrFecInicio`. Se aceptan fechas futuras. |
| Documento | Opcional y numérico. Si queda vacío se guarda `0`. |
| Situación | Con *Normal* marcado, los problemas se bloquean. Sin *Normal*, hay que marcar al menos uno. |
| Vacunas | El detalle es obligatorio solo si se marcan vacunas. |
| Guardar | Una visita en `AVEn_VisitaTec2`, y además `AVEn_VisitaTec2Rec` solo si hay recomendación (en una transacción). Después vuelve a la lista. |
| Varias visitas | Se permiten varias visitas a la misma cría el mismo día. |
| Nivel 0 | Solo nueva visita. |
| Nivel 1 | Ve las visitas de la fecha más reciente con visitas de esa cría, de todos los técnicos. |
| Nivel 2 | Ve todas las visitas de la cría, de todos los técnicos. |
| Visitas anteriores | Solo lectura, ordenadas por fecha y N.º, de la más nueva a la más antigua. Las que siguen en revisión llevan la etiqueta "En revisión". |

### Ajuste 1 (estado de la visita e informe PDF)

| Tema | Decisión |
|---|---|
| `VstTcEstado` | `0` = en revisión · `1` = aprobada/emitida. |
| Casilla *Generar informe PDF* | Junto a *Guardar*, marcada por omisión. Marcada: guarda `VstTcEstado = 1` y descarga el informe. Desmarcada: guarda `VstTcEstado = 0`, sin informe. |
| Informe | Se genera en el celular con jsPDF, en una página A4. Nombre del archivo: `Informe-VetGranja_<Granja>_<Galpón>_dia<edad>_<fecha>_N<n.º>.pdf`. |
| *Aprobar visita* | Botón bajo *Visita técnica*. Aparece solo si la cría tiene visitas en revisión hechas por el técnico que ingresó, y muestra cuántas son. |
| Editar visita en revisión | Mismo formulario que *Nueva visita*, con la misma casilla del PDF. Solo se pueden editar las visitas propias que siguen con estado 0. |
| Recomendación al editar | Se reemplaza: se borra la anterior de `AVEn_VisitaTec2Rec` y solo se inserta una nueva si hay texto. Requiere permiso `DELETE`. |
| Login | El título dice "Servicios Veterinarios en Granja". |

### Ajuste 2 (pantallas y contraseña)

| Tema | Decisión |
|---|---|
| Teléfono (< 768px) | Una columna a pantalla completa. |
| Tableta (768–1023px) | Listas de crías y visitas en 2 columnas. Formulario centrado (máx. 720px), con la casilla del PDF y los botones en una sola fila. |
| PC (≥ 1024px) | Contenido centrado (máx. 1120px), listas en 3 columnas, formulario de visita en 2 columnas (datos a la izquierda, evaluación a la derecha). |
| Ingreso y cambio de clave | Tarjeta centrada en tableta y PC. |
| Contraseña | Botón propio con un ojo para ver u ocultar el texto, igual en todos los sistemas. Se oculta el ojo nativo de Edge para que no salgan dos. |

## Estructura

```
SerVetGranja/
├─ netlify.toml               ← build, funciones y redirecciones
├─ .env.example               ← nombres de las variables (sin valores)
├─ index.html
├─ public/
│  ├─ _redirects              ← respaldo de las redirecciones (API + SPA)
│  ├─ favicon.ico             ← ícono RAMN Software
│  ├─ ramnsoft.png
│  └─ pollo.jpg
├─ netlify/
│  ├─ lib/
│  │  ├─ db.ts                ← conexión MySQL (lee DB_*) y control de autorización por cría
│  │  ├─ http.ts              ← respuestas, errores y sesión firmada
│  │  └─ visita.ts            ← validación y columnas de la visita (alta y edición)
│  └─ functions/              ← cada archivo es un endpoint /api/<nombre>
│     ├─ login.ts             POST /api/login
│     ├─ cambiar-clave.ts     POST /api/cambiar-clave
│     ├─ crias.ts             GET  /api/crias  (incluye cuántas visitas tiene el técnico en revisión)
│     ├─ cria.ts              GET  /api/cria?id=
│     ├─ visitas.ts           GET  /api/visitas?cria=   ·   POST /api/visitas
│     ├─ revision.ts          GET  /api/revision?cria=
│     └─ visita.ts            GET · PUT /api/visita?id=  (visita propia en revisión)
└─ src/
   ├─ main.tsx · App.tsx · index.css
   ├─ components/             AppBar, FichaCria, Estado, EditorVisita
   ├─ pages/                  Login, CambiarClave, Crias, NuevaVisita, VisitasAnteriores,
   │                          VisitasEnRevision, EditarVisita, NoEncontrada
   ├─ routes/                 ProtectedRoute
   ├─ hooks/                  useAuth, useApi
   ├─ lib/                    api (cliente de la API), formato, informePdf
   └─ types/
```

### Rutas de la app

| Ruta | Pantalla |
|---|---|
| `/login` | Ingreso |
| `/cambiar-clave` | Cambio obligatorio de la clave 123 |
| `/crias` | Crías autorizadas |
| `/visita/:idCria` | Nueva visita |
| `/visita/:idCria/anteriores` | Visitas anteriores (niveles 1 y 2) |
| `/visita/:idCria/revision` | Visitas propias en revisión de esa cría |
| `/visita/:idCria/revision/:idVisita` | Editar y aprobar una visita en revisión |

### Seguridad

- El navegador nunca recibe las credenciales de MySQL ni `TecPassw`.
- Al ingresar, la función entrega una sesión firmada que dura 12 horas. Su clave se deriva de `DB_PASSWORD`, así que no hace falta otra variable.
- Cada endpoint vuelve a comprobar en `TecCriaAuth` que la cría esté activa y autorizada para ese técnico, y respeta su nivel.

## Compartir e instalar la app

La app es instalable: tiene un manifiesto (`public/manifest.webmanifest`) y los íconos de RAMN Software (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png` y `apple-touch-icon.png`). Instalada, se abre como una app más, a pantalla completa y sin la barra del navegador.

**Compartir:** envía la dirección de Netlify (`https://TU-SITIO.netlify.app`) por WhatsApp, correo o un código QR. No hace falta tienda de aplicaciones.

**Instalar:**

| Dispositivo | Pasos |
|---|---|
| Android (Chrome) | Abrir el enlace y tocar **Instalar en este dispositivo** en la pantalla de ingreso, o menú ⋮ → **Instalar app** / **Agregar a la pantalla principal**. |
| iPhone / iPad (Safari) | Abrir el enlace **en Safari**, tocar **Compartir** → **Agregar a inicio** → **Agregar**. La pantalla de ingreso muestra estas instrucciones. |
| PC (Chrome o Edge) | Abrir el enlace y pulsar **Instalar en este dispositivo**, o el ícono de instalar en la barra de direcciones. |

El ícono de RAMN Software original mide solo 32×32 píxeles: se amplió sin suavizar para que se vea nítido, pero con estilo pixelado. Si tienes una versión de 512×512 o más grande, reemplaza los cuatro PNG para un ícono más fino.

## Variables de entorno en Netlify

En **Site configuration → Environment variables**:

| Variable | Ejemplo |
|---|---|
| `DB_NUBE` | `mysql.ramnsoftware.com` (o `servidor:puerto`) |
| `DB_DATABASE` | `miBaseDatos` |
| `DB_USERNAME` | `miUsuario` |
| `DB_PASSWORD` | `miContraseña` |

El usuario MySQL debe aceptar conexiones desde **cualquier IP** (host `%`), porque Netlify no sale siempre desde la misma dirección. Necesita permisos `SELECT`, `INSERT`, `UPDATE` y `DELETE` (este último solo sobre `AVEn_VisitaTec2Rec`).

## Checklist de verificación en Netlify (sin pasos locales)

**Despliegue**
- [ ] El deploy termina en verde (*Deploys → Published*).
- [ ] En *Logs → Functions* aparecen `login`, `cambiar-clave`, `crias`, `cria` y `visitas`.

**Rutas (SPA)**
- [ ] Abrir `https://TU-SITIO.netlify.app/crias` directamente redirige a `/login`. No debe quedar en blanco.
- [ ] Ya dentro, refrescar (F5) en `/crias`, en `/visita/<id>` y en `/visita/<id>/anteriores`: la página se recarga sin quedar en blanco.
- [ ] `https://TU-SITIO.netlify.app/api/crias` sin sesión responde un JSON con `"error"`, no la página HTML.

**Ingreso y contraseña**
- [ ] Un celular que no existe muestra "Este celular no está registrado".
- [ ] Una contraseña incorrecta muestra "La contraseña no es correcta".
- [ ] Un técnico con clave `123` va a *Cambia tu contraseña*. Después de cambiarla, `TecPassw` queda actualizado en MySQL.
- [ ] Al salir y volver a entrar, el celular aparece precargado.

**Crías y niveles**
- [ ] La lista coincide con el SQL de crías activas autorizadas para ese técnico.
- [ ] Nivel 0: no aparece el botón de visitas anteriores.
- [ ] Nivel 1: se ven solo las visitas de la fecha más reciente, de todos los técnicos.
- [ ] Nivel 2: se ven todas las visitas de la cría.

**Guardar visita**
- [ ] Una fecha anterior al inicio de la cría bloquea *Guardar*.
- [ ] Desmarcar *Normal* sin marcar ningún problema bloquea *Guardar*.
- [ ] Marcar *Vacunas* sin detalle bloquea *Guardar*.
- [ ] Al guardar, vuelve a la lista con el aviso "Visita guardada · N.º …".
- [ ] En MySQL aparece el registro en `AVEn_VisitaTec2`, y en `AVEn_VisitaTec2Rec` solo si se escribió una recomendación.
- [ ] Dos visitas a la misma cría el mismo día se guardan como registros separados.

**Informe PDF y aprobación (ajuste 1)**
- [ ] En el login, el título dice "Servicios Veterinarios en Granja".
- [ ] La casilla *Generar informe PDF* aparece marcada al abrir *Nueva visita*.
- [ ] Guardar con la casilla marcada descarga el informe (`Informe-VetGranja_…pdf`) y deja `VstTcEstado = 1`.
- [ ] Guardar con la casilla desmarcada no descarga nada y deja `VstTcEstado = 0`.
- [ ] Esa cría muestra *Aprobar visita (1)* solo para el técnico que hizo la visita; otro técnico no ve el botón.
- [ ] *Aprobar visita* lista solo las visitas propias en revisión de esa cría.
- [ ] Al editar una visita, los datos guardados aparecen cargados en el formulario.
- [ ] Guardar con la casilla marcada la aprueba (`VstTcEstado = 1`), descarga el informe y el botón desaparece si no quedan más.
- [ ] Guardar con la casilla desmarcada actualiza los datos y la visita sigue en revisión.
- [ ] Probar la descarga en Android y en iPhone. En iPhone, el PDF se abre en una pestaña y se guarda con *Compartir → Guardar en Archivos*.

## Subir a GitHub

Ejecuta todos los comandos dentro de `C:\Programas\React\SerVetGranja\SerVetGranja-App`, que es la raíz del repositorio.

Primera vez (crea antes el repositorio vacío `servetgranja` en GitHub):

```bash
git init
git add .
git commit -m "SerVetGranja: versión inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/servetgranja.git
git push -u origin main
```

En los cambios siguientes:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

Cada `push` a `main` lanza un deploy nuevo en Netlify.

## Conectar con Netlify (una sola vez)

1. *Add new site → Import an existing project → GitHub* y elige `servetgranja`.
2. Netlify lee `netlify.toml`: build `npm run build`, publicación `dist`, funciones `netlify/functions`.
3. Carga las cuatro variables `DB_*` y pulsa **Deploy**.
4. Si agregas las variables después del primer deploy: *Deploys → Trigger deploy → Deploy site*.
