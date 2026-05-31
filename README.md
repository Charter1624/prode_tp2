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
  docs/     Plan del proyecto (visión, arquitectura, modelo, etc.)
```

## Backend (`server/`)

API REST modular (capas `routes → controllers → services → models`, validación
con Zod, JWT, seguridad con helmet/cors/rate-limit). Lógica de puntaje testeada
con Jest.

Puesta en marcha rápida:

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

App en React Native + Expo (expo-router). Se conecta a la API a través de una
capa `api.js` (URL base + token JWT). Ver el plan en
[`docs/05-frontend.md`](docs/05-frontend.md).

## Documentación

El plan completo del proyecto está en [`docs/`](docs/): visión y alcance,
arquitectura, modelo de datos, endpoints, testing, cronograma y el mapeo de cada
unidad de la materia.

## Estado

- [x] Plan del proyecto
- [x] Backend (auth + partidos + pronósticos + ranking + seeder + tests)
- [ ] Frontend (app Expo conectada a la API)
