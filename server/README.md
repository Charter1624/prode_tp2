# Prode Mundial 2026 — Backend (API)

API REST del prode: **Node + Express + Mongoose (MongoDB) + JWT**. Estructura
modular calcada del CRM de Quadro (capas `routes → controllers → services → models`).

> Esto es solo el backend. La app (React Native + Expo) se conecta después
> contra esta API (ver `../docs/05-frontend.md`).

## Requisitos

- Node 18+ (probado con Node 22)
- MongoDB corriendo: local (`mongod`) o un cluster de **MongoDB Atlas**

## Puesta en marcha

```bash
cd server
cp .env.example .env        # y editá MONGO_URI y JWT_SECRET
npm install
npm run seed                # carga datos de prueba (opcional pero recomendado)
npm run dev                 # levanta la API en http://localhost:3000
```

Probá que está viva:

```bash
curl http://localhost:3000/api/health
# { "ok": true, "time": "..." }
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta la API con nodemon (reinicia al guardar). |
| `npm start` | Levanta la API con node (producción). |
| `npm run seed` | Limpia la base y carga usuarios, partidos y pronósticos de prueba. |
| `npm test` | Corre los tests de Jest (lógica de puntaje). |

## Usuarios de prueba (tras `npm run seed`)

Password de todos: **`prode1234`**

| Email | Rol |
|---|---|
| `admin@prode.com` | admin (carga fixture y resultados) |
| `tincho@prode.com` / `naza@prode.com` / `fede@prode.com` | jugadores |

## Endpoints

`🔒` = requiere token JWT (`Authorization: Bearer <token>`) · `👑` = solo admin

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crea un jugador. Devuelve `{ token, user }`. |
| `POST` | `/api/auth/login` | Login. Devuelve `{ token, user }`. |
| `GET` | `/api/auth/me` 🔒 | Datos del usuario del token (rehidratar sesión). |
| `GET` | `/api/partidos` | Lista de partidos. Filtro `?estado=pendiente\|jugado`. |
| `POST` | `/api/partidos` 🔒👑 | Crea un partido. |
| `PUT` | `/api/partidos/:id/resultado` 🔒👑 | Carga el resultado → recalcula puntos. |
| `POST` | `/api/pronosticos` 🔒 | Crea o edita el pronóstico (solo si el partido no empezó). |
| `GET` | `/api/pronosticos/mios` 🔒 | Pronósticos del usuario logueado. |
| `GET` | `/api/ranking` | Tabla de posiciones (suma de puntos por jugador). |

### Lógica de puntaje

| Caso | Puntos |
|---|---|
| Marcador exacto | 3 |
| Acertó el resultado (ganador/empate) pero no el marcador | 1 |
| Erró | 0 |

Vive en `services/puntaje.js` (función pura) y está testeada en `tests/puntaje.test.js`.

## Estructura

```
server/
  index.js              # bootstrap: conecta a Mongo y escucha
  app.js                # app Express (middleware, rutas, error handler)
  config/db.js          # conexión a MongoDB
  models/               # User, Partido, Pronostico (Mongoose)
  schemas/validation.js # validación de inputs con Zod
  middleware/           # auth (JWT), roles (admin), validate (Zod)
  controllers/          # handlers por recurso
  routes/               # define endpoints y wirea middleware + controllers
  services/             # logger, puntaje (puro), ranking
  seeds/seed.js         # datos de prueba
  tests/                # tests de Jest
```

## Conectar la app (gotcha de red)

La URL del backend cambia según dónde corra la app:

| App corriendo en | URL del backend |
|---|---|
| Simulador de iOS | `http://localhost:3000` |
| Emulador de Android | `http://10.0.2.2:3000` |
| Celular físico (Expo Go) | `http://<IP-de-tu-PC>:3000` |

Por eso conviene tener la URL base en un solo archivo de la app (`api.js`).
Detalle completo en `../docs/08-entorno-simuladores-distribucion.md`.
