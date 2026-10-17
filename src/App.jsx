import { useState } from "react";
import { CITIES, planTrip, inr, titleCase } from "./planner.js";

const iso = (d) => d.toISOString().slice(0, 10);
const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const dayCount = (f) => Math.round((new Date(f.end) - new Date(f.start)) / 864e5) + 1;

const INITIAL = { from: "Jaipur", to: "Delhi", start: plus(7), end: plus(9), travelers: 2, budget: 10000, transport: "any", stay: "any" };

export default function App() {
  const [f, setF] = useState(INITIAL);
  const [plan, setPlan] = useState(() => planTrip({ ...INITIAL, days: 3 }));
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const days = dayCount(f);
    if (!f.from.trim() || !f.to.trim()) return setError("Enter both a starting location and a destination.");
    if (f.from.trim().toLowerCase() === f.to.trim().toLowerCase()) return setError("Starting location and destination must be different.");
    if (!(days >= 1 && days <= 14)) return setError("Choose an end date that is 1 to 14 days from the start date.");
    if (!(+f.budget > 0) || !(+f.travelers >= 1)) return setError("Budget and travelers must be greater than zero.");
    setError("");
    setPlan(planTrip({ ...f, days }));
  };

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="brand">TRIPIQ</div>
          <h1>Plan Smart, Travel More!</h1>
          <p>Compare transport, pick a stay, check your budget and get a day-wise plan, all in one place.</p>
        </div>
      </header>

      <main className="wrap layout">
        <form className="card form" onSubmit={submit}>
          <h2>Your trip</h2>
          <label>Starting location
            <input list="cities" value={f.from} onChange={set("from")} placeholder="e.g. Jaipur" />
          </label>
          <label>Destination
            <input list="cities" value={f.to} onChange={set("to")} placeholder="e.g. Delhi" />
          </label>
          <datalist id="cities">{Object.keys(CITIES).map((c) => <option key={c} value={titleCase(c)} />)}</datalist>
          <div className="row">
            <label>Start date<input type="date" value={f.start} onChange={set("start")} /></label>
            <label>End date<input type="date" min={f.start} value={f.end} onChange={set("end")} /></label>
          </div>
          <div className="row">
            <label>Travelers<input type="number" min="1" max="20" value={f.travelers} onChange={set("travelers")} /></label>
            <label>Total budget (₹)<input type="number" min="1000" step="500" value={f.budget} onChange={set("budget")} /></label>
          </div>
          <label>Preferred transport
            <select value={f.transport} onChange={set("transport")}>
              <option value="any">Best fit for my budget</option>
              <option value="bus">Bus</option>
              <option value="train">Train</option>
              <option value="cab">Cab</option>
              <option value="flight">Flight</option>
            </select>
          </label>
          <label>Accommodation preference
            <select value={f.stay} onChange={set("stay")}>
              <option value="any">Best fit for my budget</option>
              <option value="hostel">Hostel</option>
              <option value="budget">Budget hotel</option>
              <option value="comfort">3-star hotel</option>
            </select>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" type="submit">Plan my trip</button>
        </form>

        <section className="results" aria-live="polite">
          <div className="card summary">
            <div className="route">
              <h2>{plan.from} to {plan.to}</h2>
              <p>{plan.days} {plan.days > 1 ? "days" : "day"} · {plan.n} {plan.n > 1 ? "travelers" : "traveler"} · about {plan.km} km · budget {inr(plan.budget)}</p>
            </div>
            <div className={"left " + (plan.over ? "bad" : "good")}>
              <span>{plan.over ? "Over budget by" : "Remaining budget"}</span>
              <strong>{inr(Math.abs(plan.left))}</strong>
            </div>
            <div className="bar" role="img" aria-label="Budget split">
              {plan.breakdown.map((b) => (
                <i key={b.k} className={b.k} style={{ flexGrow: b.amount }} title={`${b.label}: ${inr(b.amount)}`} />
              ))}
              {!plan.over && <i className="rest" style={{ flexGrow: plan.left }} title="Remaining" />}
            </div>
            <table>
              <tbody>
                {plan.breakdown.map((b) => (
                  <tr key={b.k}><td><i className={"dot " + b.k} />{b.label}</td><td>{inr(b.amount)}</td></tr>
                ))}
                <tr className="total"><td>Total estimated cost</td><td>{inr(plan.total)}</td></tr>
              </tbody>
            </table>
            <p className="note">Illustrative values only; not based on live prices or real booking data.</p>
          </div>

          {plan.notice && <p className="banner">{plan.notice}</p>}

          <div className="card">
            <h2>Transport comparison</h2>
            <ul className="opts">
              {plan.modes.map((m) => (
                <li key={m.id} className={m.id === plan.chosenMode ? "pick" : ""}>
                  <span className="ico">{m.icon}</span>
                  <div><b>{m.name}</b><small>about {m.hours} h each way</small></div>
                  <div className="price">{inr(m.cost)}<small>round trip</small></div>
                  {m.id === plan.chosenMode && <em>Selected</em>}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Where to stay ({plan.nights} {plan.nights === 1 ? "night" : "nights"})</h2>
            <ul className="opts">
              {plan.stays.map((s) => (
                <li key={s.id} className={s.id === plan.chosenStay ? "pick" : ""}>
                  <span className="ico">🛏️</span>
                  <div><b>{s.name}</b><small>{s.note}</small></div>
                  <div className="price">{inr(s.cost)}<small>total</small></div>
                  {s.id === plan.chosenStay && <em>Selected</em>}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Day-wise itinerary</h2>
            <ol className="days">
              {plan.itinerary.map((d) => (
                <li key={d.title}><b>{d.title}</b><span>{d.text}</span></li>
              ))}
            </ol>
            <button className="ghost" onClick={() => window.print()}>Print or save as PDF</button>
          </div>
        </section>
      </main>

      <footer className="wrap foot">Smart Travel Planning System | VGU | Prayas 2026</footer>
    </>
  );
}
