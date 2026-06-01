# Prode del Mundial 2026 — Taller de Programación 2

Proyecto **full-stack** para jugar un prode del Mundial 2026 entre amigos y, a la
vez, aplicar de punta a punta los contenidos de la materia (JS, asincronismo,
Node, Express, base de datos y JWT).

Cada jugador carga sus pronósticos de los partidos y la app lleva el ranking
automáticamente según los resultados que carga el admin.

## Estructura (monorepo)

```
prode_tp2/
  server/   API REST — Node + Express + Mongoose (MongoDB) + JWT   ✅ listo
  client/   App — React Native + Expo                              ⏳ pendiente
```

## Modelo de datos

- **Equipo** — selección (nombre, código de país para la bandera, grupo).
- **Partido** — referencia dos `Equipo`, fecha, fase, goles, estado.
- **User** — el jugador del prode (con rol `admin`).
- **Pronostico** — relación N:M entre `User` y `Partido` con el marcador apostado + puntos.

## Backend (`server/`)

API REST modular por capas (`routes → controllers → services → models`),
validación con Zod, JWT, seguridad con helmet/cors/rate-limit, y lógica de
puntaje testeada con Jest.

```bash
cd server
cp .env.example .env     # configurar MONGO_URI y JWT_SECRET
npm install
npm run seed             # datos de prueba (opcional)
npm run dev              # API en http://localhost:3000
npm test                 # tests de la lógica de puntaje
```

Detalle completo de endpoints y uso en [`server/README.md`](server/README.md).

## Frontend (`client/`)

App en React Native + Expo (expo-router). Se conectará a la API a través de una
capa `api.js` (URL base + token JWT). Las banderas de los equipos se muestran
con `flagcdn.com` a partir del código de país de cada `Equipo`.

## Estado

- [x] Backend (equipos + partidos + pronósticos + ranking + auth + seeder + tests)
- [ ] Frontend (app Expo conectada a la API)
