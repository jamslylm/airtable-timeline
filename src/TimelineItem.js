import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * Renders a single timeline bar for an item with drag/resize and inline editing.
 * Props:
 *  - item: { id, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', name }
 *  - dateToX: (dateStr) => number // maps date to x position in px
 *  - pixelsPerDay: number
 *  - onUpdate: (updatedItemPartial) => void
 */
export default function TimelineItem({ item, dateToX, pixelsPerDay, onUpdate, onSelect }) {
  if (!item) return null;

  const [draft, setDraft] = useState(null); // {start, end} while dragging
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const clickTimerRef = useRef(null);
  const clickDelay = 250; // ms to differentiate single vs double click

  const left = dateToX((draft || item).start);
  // inclusive end day: add one day width
  const right = dateToX((draft || item).end) + pixelsPerDay;
  const width = Math.max(pixelsPerDay, right - left);
  const showMeta = width >= 140; // show dates only when there is enough space
  const className = `timeline-item${showMeta ? ' show-meta' : ''}`;

  // Helpers
  const toISO = (d) => format(d, "yyyy-MM-dd");
  const clampRange = useCallback((sStr, eStr) => {
    const s = parseISO(sStr);
    const e = parseISO(eStr);
    if (e < s) return { start: toISO(e), end: toISO(s) }; // swap to enforce start<=end
    return { start: toISO(s), end: toISO(e) };
  }, []);

  const startDragState = useRef(null);
  const wasDraggingRef = useRef(false);

  const clearClickTimer = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };

  const onMouseDownBody = (e) => {
    if (editing) return;
    // Start moving whole bar
    e.preventDefault();
    e.stopPropagation();
    clearClickTimer();
    const startDate = parseISO(item.start);
    const endDate = parseISO(item.end);
    startDragState.current = {
      kind: "move",
      startX: e.pageX,
      scrollXAtStart: window.scrollX,
      startDate,
      endDate,
      activated: false,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseDownHandle = (side) => (e) => {
    if (editing) return;
    e.preventDefault();
    e.stopPropagation();
    clearClickTimer();
    const startDate = parseISO(item.start);
    const endDate = parseISO(item.end);
    startDragState.current = {
      kind: "resize",
      side, // 'left' or 'right'
      startX: e.pageX,
      scrollXAtStart: window.scrollX,
      startDate,
      endDate,
      activated: false,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    const s = startDragState.current;
    if (!s) return;
    const rawDeltaPx = (e.pageX - s.startX) + (window.scrollX - (s.scrollXAtStart || 0));
    const activateThreshold = 4; // px
    if (!s.activated && Math.abs(rawDeltaPx) < activateThreshold) {
      return;
    }
    s.activated = true;

    const deltaDays = Math.round(rawDeltaPx / pixelsPerDay);

    if (s.kind === "move") {
      const newStart = addDays(s.startDate, deltaDays);
      const newEnd = addDays(s.endDate, deltaDays);
      const next = clampRange(toISO(newStart), toISO(newEnd));
      setDraft(next);
    } else if (s.kind === "resize") {
      if (s.side === "left") {
        const newStart = addDays(s.startDate, deltaDays);
        const next = clampRange(toISO(newStart), toISO(s.endDate));
        setDraft(next);
      } else {
        const newEnd = addDays(s.endDate, deltaDays);
        const next = clampRange(toISO(s.startDate), toISO(newEnd));
        setDraft(next);
      }
    }
  };

  const onMouseUp = (e) => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    const s = startDragState.current;
    if (!s) return setDraft(null);
    // If activated but no latest draft (e.g., last move skipped), compute final draft now
    if (s.activated && !draft) {
      const rawDeltaPx = (e?.pageX ?? s.startX) - s.startX + (window.scrollX - (s.scrollXAtStart || 0));
      const deltaDays = Math.round(rawDeltaPx / pixelsPerDay);
      if (s.kind === 'move') {
        const newStart = addDays(s.startDate, deltaDays);
        const newEnd = addDays(s.endDate, deltaDays);
        const next = clampRange(toISO(newStart), toISO(newEnd));
        onUpdate && onUpdate({ id: item.id, ...next });
        startDragState.current = null;
        clearClickTimer();
        return setDraft(null);
      } else if (s.kind === 'resize') {
        if (s.side === 'left') {
          const newStart = addDays(s.startDate, deltaDays);
          const next = clampRange(toISO(newStart), toISO(s.endDate));
          onUpdate && onUpdate({ id: item.id, ...next });
          startDragState.current = null;
          clearClickTimer();
          return setDraft(null);
        } else {
          const newEnd = addDays(s.endDate, deltaDays);
          const next = clampRange(toISO(s.startDate), toISO(newEnd));
          onUpdate && onUpdate({ id: item.id, ...next });
          startDragState.current = null;
          clearClickTimer();
          return setDraft(null);
        }
      }
    }
    if (s.activated) {
      wasDraggingRef.current = true;
      clearClickTimer();
    }
    startDragState.current = null;
    if (!s.activated) {
      // Not a real drag; reset any draft.
      return setDraft(null);
    }
    if (!draft) return setDraft(null);
    onUpdate && onUpdate({ id: item.id, ...draft });
    setDraft(null);
  };

  // Inline editing
  const beginEdit = (e) => {
    e.stopPropagation();
    clearClickTimer();
    setEditing(true);
    setTimeout(() => inputRef.current && inputRef.current.select(), 0);
  };
  const commitEdit = () => {
    const value = inputRef.current ? inputRef.current.value.trim() : item.name;
    if (value && value !== item.name) {
      onUpdate && onUpdate({ id: item.id, name: value });
    }
    setEditing(false);
  };
  const cancelEdit = () => {
    setEditing(false);
  };

  const onKeyDownInput = (e) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") cancelEdit();
  };

  // Cleanup: ensure we don't leave listeners attached if unmounted mid-drag
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      clearClickTimer();
    };
  }, []);

  return (
    <div
      className={className}
      style={{ left, width }}
      title={`${item.name} (${(draft||item).start} → ${(draft||item).end})`}
      onDoubleClick={(e) => {
        beginEdit(e);
      }}
      onMouseDown={onMouseDownBody}
      onClick={(e) => {
        e.stopPropagation();
        if (editing) return;
        if (wasDraggingRef.current) {
          wasDraggingRef.current = false;
          return;
        }
        clearClickTimer();
        clickTimerRef.current = setTimeout(() => {
          if (!editing) {
            onSelect && onSelect(item);
          }
          clickTimerRef.current = null;
        }, clickDelay);
      }}
    >
      <div className="resize-handle left" onMouseDown={onMouseDownHandle('left')} />
      <div className="content">
        {editing ? (
          <input
            ref={inputRef}
            className="edit-input"
            defaultValue={item.name}
            onBlur={commitEdit}
            onKeyDown={onKeyDownInput}
            autoFocus
          />
        ) : (
          <>
            <div className="name">{item.name}</div>
            <div className="meta">{(draft || item).start} — {(draft || item).end}</div>
          </>
        )}
      </div>
      <div className="resize-handle right" onMouseDown={onMouseDownHandle('right')} />
    </div>
  );
}
