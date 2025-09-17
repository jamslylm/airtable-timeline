/**
 * assignLanes(items, options)
 * - items: array of { id, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', name }
 * - options:
 *    - minGapDays: number of days to require as gap between items to allow sharing lane (default 0)
 *
 * Returns: array of lanes (each lane is array of items)
 */
export default function assignLanes(items = [], options = {}) {
  const { minGapDays = 0 } = options;
  const msPerDay = 24 * 60 * 60 * 1000;

  // clone to avoid mutating original
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  );

  const lanes = [];

  function canPlaceAfter(laneItem, newItem) {
    // laneItem.end < newItem.start - minGapDays
    const laneEnd = new Date(laneItem.end);
    const nextStart = new Date(newItem.start);
    const diffDays = Math.floor((nextStart - laneEnd) / msPerDay);
    // If laneEnd is same day as nextStart, diffDays === 0
    return diffDays >= minGapDays;
  }

  function assignItemToLane(item) {
    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      if (canPlaceAfter(last, item)) {
        lane.push(item);
        return;
      }
    }
    lanes.push([item]);
  }

  for (const item of sortedItems) {
    assignItemToLane(item);
  }

  return lanes;
}