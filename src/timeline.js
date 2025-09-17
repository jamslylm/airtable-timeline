import React, { useMemo, useState, useEffect } from "react";
import { differenceInCalendarDays, parseISO, addDays, format } from "date-fns";
import TimelineItem from "./TimelineItem.js";

function getBounds(items) {
  if (!items || items.length === 0) {
    const now = new Date();
    return { min: now, max: now };
  }
  const starts = items.map((i) => parseISO(i.start));
  const ends = items.map((i) => parseISO(i.end));
  const min = new Date(Math.min(...starts));
  const max = new Date(Math.max(...ends));
  return { min, max };
}

export default function Timeline({ lanes = [], items = [], pixelsPerDay = 6, onUpdateItem, selectedItem, onSelectItem }) {
  const { min, max } = useMemo(() => getBounds(items), [items]);
  // add small padding at ends
  const left = addDays(min, -7);
  const right = addDays(max, 7);
  const totalDays = Math.max(1, differenceInCalendarDays(right, left) + 1);
  const width = totalDays * pixelsPerDay;

  // date ruler steps: pick rough step so ticks aren't too dense
  const approxTickPx = 100;
  const tickDays = Math.max(1, Math.round(approxTickPx / pixelsPerDay));

  function dateToX(dateStr) {
    const d = parseISO(dateStr);
    return differenceInCalendarDays(d, left) * pixelsPerDay;
  }

  // Inline editing state for modal
  const [editingName, setEditingName] = useState(selectedItem ? selectedItem.name : "");
  useEffect(() => {
    setEditingName(selectedItem ? selectedItem.name : "");
  }, [selectedItem]);

  function commitName() {
    if (!selectedItem) return;
    const next = (editingName || "").trim();
    if (next && next !== selectedItem.name) {
      onUpdateItem && onUpdateItem({ id: selectedItem.id, name: next });
      // keep modal open; optionally also update the selected object reference if needed
    }
  }

  function cancelName() {
    setEditingName(selectedItem ? selectedItem.name : "");
  }

  return (
    <div className="timeline-shell" onClick={() => onSelectItem && onSelectItem(null)}>
      <div className="ruler" style={{ width }}>
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = addDays(left, i);
          if (i % tickDays !== 0) return null;
          return (
            <div
              key={i}
              className="ruler-tick"
              style={{ left: i * pixelsPerDay }}
              title={format(day, "yyyy-MM-dd")}
            >
              <div className="tick-line" />
              <div className="tick-label">{format(day, "MMM d, yyyy")}</div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <>
          <div className="modal-backdrop" onClick={() => onSelectItem && onSelectItem(null)} />
          <div className="modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              aria-label="Close"
              onClick={() => onSelectItem && onSelectItem(null)}
            >
              ×
            </button>
            <div className="modal-title">
              <input
                className="edit-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitName(); }
                  if (e.key === 'Escape') { e.preventDefault(); cancelName(); }
                }}
                onBlur={commitName}
                autoFocus
                aria-label="Edit name"
              />
            </div>
            <div className="modal-body">
              <div className="row"><strong>Start:</strong> {selectedItem.start}</div>
              <div className="row"><strong>End:</strong> {selectedItem.end}</div>
            </div>
          </div>
        </>
      )}

      <div className="lanes" style={{ width }}>
        {lanes.map((lane, idx) => (
          <div key={idx} className="lane-row">
            {lane.map((it) => (
              <TimelineItem
                key={it.id}
                item={it}
                dateToX={dateToX}
                pixelsPerDay={pixelsPerDay}
                onUpdate={onUpdateItem}
                onSelect={onSelectItem}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}