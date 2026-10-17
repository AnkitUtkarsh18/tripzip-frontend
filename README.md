# TripIQ – Smart Travel Planning System (Frontend)

React + Vite prototype matching the project PPT: trip form, budget calculator, transport comparison,
stay recommendation, day-wise itinerary and final trip summary. Prices are illustrative, not live.

## Run it
1. Install Node.js 18+ from https://nodejs.org
2. In this folder run: `npm install` then `npm run dev`
3. Open http://localhost:5173
4. Production build: `npm run build` (output in `dist/`)

## Structure
- `src/planner.js` – all planning logic (distance, costs, picks the best option within budget, itinerary). Edit the rates here.
- `src/App.jsx` – form + results UI. `src/styles.css` – theme (navy/teal/blue from the PPT, Lato font).

## Resources
- React docs: https://react.dev · Vite docs: https://vite.dev
- Font: Lato (Google Fonts, already linked in `index.html`)
- Deploy free: Vercel or Netlify (build command `npm run build`, output `dist`)

## Next steps from your "Future Scope" slide (all free tiers)
- Backend: Node/Express route `POST /api/plan` that calls `planTrip()`; in `App.jsx` replace `planTrip(...)` with `fetch("/api/plan", ...)` and enable the proxy in `vite.config.js`.
- Weather: Open-Meteo API (no key needed) – https://open-meteo.com
- Maps and routes: Leaflet + OpenStreetMap – https://leafletjs.com
- Saved trips and accounts: Firebase Auth/Firestore or MongoDB Atlas
- Real prices: transport and stay APIs (replace the rates in `planner.js` with API data)
