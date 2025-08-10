# Renewable Energy Site Assessment

Static Leaflet frontend with a Node/Express + PostGIS backend for polygon-based site analysis.

## Structure
- `index.html`: Frontend map UI (served via a simple HTTP server)
- `backend/`: Node.js backend APIs (Express + `pg`)

## Prerequisites
- Node.js 18+
- PostgreSQL with PostGIS

## Backend setup
```
cd backend
npm install
# create .env (example below)
npm start
```

`.env` example:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_database
```

## Frontend setup
```
python3 -m http.server 8000
# open http://localhost:8000
```

## Endpoints
- `POST /api/analyze-polygon` — multi-layer intersect summary
- `POST /api/find-points-in-polygon` — legacy endpoint (single layer)
- `POST /api/alc-summary` — ALC area by grade (numbers only)
- `GET /api/health` — health check

## Notes
- DB layers may be in EPSG:27700. The backend transforms the incoming polygon (EPSG:4326) to the table SRID for spatial predicates and returns geometries as EPSG:4326 for the map.
- Ensure GiST indexes on geometry columns for performance.

