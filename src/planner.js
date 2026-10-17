// Trip planning logic. All prices are ILLUSTRATIVE (as stated in the project PPT).
// To move this to the Express backend later, keep planTrip() and call it from a route.

export const CITIES = {
  jaipur: [26.91, 75.79], delhi: [28.61, 77.21], agra: [27.18, 78.02],
  udaipur: [24.59, 73.71], jodhpur: [26.24, 73.02], mumbai: [19.08, 72.88],
  goa: [15.3, 74.12], manali: [32.24, 77.19], shimla: [31.1, 77.17],
  rishikesh: [30.09, 78.27], varanasi: [25.32, 82.99], bengaluru: [12.97, 77.59],
};

const SPOTS = {
  delhi: ["Connaught Place", "India Gate", "Red Fort", "Chandni Chowk food walk", "Qutub Minar", "Humayun's Tomb", "Lodhi Garden"],
  agra: ["Taj Mahal at sunrise", "Agra Fort", "Mehtab Bagh", "Sadar Bazaar"],
  jaipur: ["Hawa Mahal", "Amber Fort", "City Palace", "Johari Bazaar", "Nahargarh Fort"],
  udaipur: ["City Palace", "Lake Pichola boat ride", "Saheliyon ki Bari", "Sajjangarh"],
  jodhpur: ["Mehrangarh Fort", "Jaswant Thada", "Clock Tower market"],
  mumbai: ["Gateway of India", "Marine Drive", "Colaba Causeway", "Elephanta Caves"],
  goa: ["Baga Beach", "Fort Aguada", "Old Goa churches", "Palolem Beach"],
  manali: ["Hadimba Temple", "Old Manali cafes", "Solang Valley", "Mall Road"],
  shimla: ["The Ridge", "Mall Road", "Jakhu Temple", "Kufri"],
  rishikesh: ["Laxman Jhula", "Ganga Aarti at Triveni Ghat", "River rafting", "Beatles Ashram"],
  varanasi: ["Dashashwamedh Ghat aarti", "Kashi Vishwanath", "Sarnath", "Assi Ghat sunrise"],
  bengaluru: ["Lalbagh", "Cubbon Park", "Bangalore Palace", "Church Street"],
};

const MODES = [
  { id: "bus", group: "bus", icon: "🚌", name: "Bus", rate: 1.7, min: 150, speed: 48, comfort: 2 },
  { id: "sleeper", group: "train", icon: "🚆", name: "Train (Sleeper)", rate: 0.9, min: 150, speed: 55, comfort: 1 },
  { id: "ac", group: "train", icon: "🚆", name: "Train (AC)", rate: 2.4, min: 400, speed: 60, comfort: 3 },
  { id: "cab", group: "cab", icon: "🚕", name: "Shared cab (up to 4)", rate: 11, min: 0, speed: 55, comfort: 4, perVehicle: true },
  { id: "flight", group: "flight", icon: "✈️", name: "Flight", rate: 5.5, min: 2500, speed: 650, comfort: 5, minKm: 500, extraHrs: 3 },
];

const STAYS = [
  { id: "hostel", name: "Backpacker hostel", note: "Dorm bed, near transit hub", rate: 600, comfort: 1 },
  { id: "budget", name: "Budget hotel", note: "Private room, 2 guests per room", rate: 1500, room: true, comfort: 2 },
  { id: "comfort", name: "3-star hotel", note: "Private room with breakfast", rate: 3200, room: true, comfort: 3 },
];

export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const key = (s) => s.trim().toLowerCase();
export const titleCase = (s) => s.trim().replace(/\b\w/g, (c) => c.toUpperCase());

function distanceKm(a, b) {
  const p = CITIES[key(a)], q = CITIES[key(b)];
  if (!p || !q) return 350; // unknown city: assume a mid-range trip
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(q[0] - p[0]) / 2) ** 2 +
    Math.cos(r(p[0])) * Math.cos(r(q[0])) * Math.sin(r(q[1] - p[1]) / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)) * 1.25); // 1.25 ≈ road factor
}

function buildItinerary(dest, days) {
  const spots = SPOTS[key(dest)] || ["Local sightseeing", "Heritage walk", "Popular market", "Local food trail", "Scenic viewpoint"];
  const place = titleCase(dest);
  if (days === 1) return [{ title: "Day 1", text: `Day trip: ${spots.slice(0, 3).join(", ")}` }];
  const out = [{ title: "Day 1", text: `Arrive in ${place}, check in, evening at ${spots[0]}` }];
  let i = 1;
  for (let d = 2; d < days; d++) {
    const pick = [0, 1, 2].map((k) => spots[(i + k) % spots.length]);
    out.push({ title: `Day ${d}`, text: pick.join(", ") });
    i += 3;
  }
  out.push({ title: `Day ${days}`, text: `${spots[i % spots.length]}, shopping, return to ${"your starting city"}` });
  return out;
}

export function planTrip(f) {
  const n = Math.max(1, +f.travelers), days = Math.max(1, +f.days);
  const nights = days - 1, budget = +f.budget, km = distanceKm(f.from, f.to);

  const eligible = MODES.filter((m) => !m.minKm || km >= m.minKm).map((m) => {
    const perWay = Math.max(m.min, m.rate * km);
    const cost = perWay * (m.perVehicle ? Math.ceil(n / 4) : n) * 2;
    return { ...m, cost: Math.round(cost), hours: +(km / m.speed + (m.extraHrs || 0)).toFixed(1) };
  });
  const stays = STAYS.map((s) => ({
    ...s, cost: s.room ? Math.ceil(n / 2) * s.rate * nights : s.rate * n * nights,
  }));

  let notice = "";
  let modePool = eligible.filter((m) => f.transport === "any" || m.group === f.transport);
  if (!modePool.length) { modePool = eligible; notice = "Flights are only suggested for routes over 500 km, so other options are shown."; }
  const stayPool = stays.filter((s) => f.stay === "any" || s.id === f.stay);

  const food = 400 * n * days, activities = 150 * n * days;
  const combos = modePool.flatMap((m) => stayPool.map((s) => {
    const sub = m.cost + s.cost + food + activities;
    return { m, s, misc: Math.round(sub * 0.05), total: Math.round(sub * 1.05), score: m.comfort + s.comfort };
  }));
  const fits = combos.filter((c) => c.total <= budget).sort((a, b) => b.score - a.score || a.total - b.total);
  const best = fits[0] || combos.sort((a, b) => a.total - b.total)[0];

  return {
    km, days, nights, n, budget, notice,
    from: titleCase(f.from), to: titleCase(f.to),
    modes: eligible, stays, chosenMode: best.m.id, chosenStay: best.s.id,
    breakdown: [
      { k: "transport", label: "Transport", amount: best.m.cost },
      { k: "stay", label: "Accommodation", amount: best.s.cost },
      { k: "food", label: "Food", amount: food },
      { k: "activities", label: "Activities", amount: activities },
      { k: "misc", label: "Miscellaneous", amount: best.misc },
    ],
    total: best.total, left: budget - best.total, over: best.total > budget,
    itinerary: buildItinerary(f.to, days).map((d, i, a) =>
      i === a.length - 1 && days > 1 ? { ...d, text: d.text.replace("your starting city", titleCase(f.from)) } : d),
  };
}
