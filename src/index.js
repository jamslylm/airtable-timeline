import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems.js";
import assignLanes from "./assignLanes.js";
import Timeline from "./timeline.js";
import "./app.css";

function App() {
  // app-level state: items (editable)
  const [items, setItems] = useState(timelineItems);
  // zoom controls pixels-per-day
  const [pixelsPerDay, setPixelsPerDay] = useState(6); // initial scale
  // minGapDays: heuristic to leave space for labels (increase when zoomed out)
  const minGapDays = Math.max(0, Math.floor(40 / pixelsPerDay));

  const lanes = useMemo(() => assignLanes(items, { minGapDays }), [items, minGapDays]);

  function updateItem(updated) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)));
  }

  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="app">
      <header>
        <h1>Timeline — Airtable-style (Demo)</h1>
        <div className="controls">
          <label>
            Zoom (pixels/day): {pixelsPerDay}
            <input
              type="range"
              min="2"
              max="20"
              value={pixelsPerDay}
              onChange={(e) => setPixelsPerDay(Number(e.target.value))}
            />
          </label>
        </div>
      </header>
      <main>
        <Timeline
          lanes={lanes}
          pixelsPerDay={pixelsPerDay}
          items={items}
          onUpdateItem={updateItem}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
        />
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

export default App;