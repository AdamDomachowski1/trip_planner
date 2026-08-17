// Adding, moving, deleting and coloring dots.
// Dots are drawn in screen coordinates — constant radius regardless of zoom.

import { drag } from 'https://cdn.jsdelivr.net/npm/d3-drag@3/+esm';
import { map, toScreen, toLonLat } from './map.js';
import { state, getPoint, addPoint, movePoint, deletePoint, deleteLink, selectPoint, addLink, emit } from './state.js';

const RADIUS = 6;

export function initPoints() {
  // clicking the map background adds a point (not after a pan — zoom sets defaultPrevented)
  map.svg.on('click', (event) => {
    if (!state.editMode) return;
    if (event.defaultPrevented) return;
    if (event.target.closest('#points') || event.target.closest('#links')) return;
    const rect = map.svg.node().getBoundingClientRect();
    const coords = toLonLat(event.clientX - rect.left, event.clientY - rect.top);
    if (!coords) return;
    const p = addPoint(coords[0], coords[1]);
    selectPoint(p.id);
  });

  // Delete removes the selected point or link
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!state.editMode) return;
    if (state.selectedPointId) {
      event.preventDefault();
      deletePoint(state.selectedPointId);
    } else if (state.selectedLinkId) {
      event.preventDefault();
      deleteLink(state.selectedLinkId);
    }
  });
}

function onPointClick(event, d) {
  event.stopPropagation();
  if (state.connectMode) {
    if (!state.connectFrom) {
      state.connectFrom = d.id;
      emit('selection'); // refresh highlight
    } else {
      addLink(state.connectFrom, d.id);
      state.connectFrom = null;
      emit('selection');
    }
    return;
  }
  selectPoint(d.id);
}

const dragBehavior = drag()
  // dragging dots only in edit mode
  .filter(event => state.editMode && !event.ctrlKey && !event.button)
  // drag coordinates in the SVG frame, not in the dot's translated group
  .container(function () { return map.gPoints.node(); })
  .on('start', function (event) { event.sourceEvent.stopPropagation(); })
  .on('drag', function (event, d) {
    const coords = toLonLat(event.x, event.y);
    if (!coords) return;
    movePoint(d.id, coords[0], coords[1]);
  });

// label positions relative to the dot: [dx, dy, text-anchor]
const LABEL_POS = {
  right:  [RADIUS + 4, 4, 'start'],
  left:   [-(RADIUS + 4), 4, 'end'],
  top:    [0, -(RADIUS + 5), 'middle'],
  bottom: [0, RADIUS + 13, 'middle'],
};
const LABEL_ANGLES = { right: 0, bottom: 90, left: 180, top: 270 };

// automatic side pick: as far in angle as possible from all of the point's arrows
function autoLabelPos(point) {
  const dirs = [];
  for (const l of state.data.links) {
    const otherId = l.from === point.id ? l.to : (l.to === point.id ? l.from : null);
    if (!otherId) continue;
    const other = getPoint(otherId);
    if (!other) continue;
    const [x1, y1] = toScreen(point.lon, point.lat);
    const [x2, y2] = toScreen(other.lon, other.lat);
    dirs.push(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI);
  }
  if (dirs.length === 0) return 'right';

  let best = 'right';
  let bestScore = -1;
  for (const [pos, angle] of Object.entries(LABEL_ANGLES)) {
    // angular distance to the nearest arrow
    let score = Infinity;
    for (const d of dirs) {
      let diff = Math.abs(angle - ((d + 360) % 360));
      if (diff > 180) diff = 360 - diff;
      score = Math.min(score, diff);
    }
    if (score > bestScore) {
      bestScore = score;
      best = pos;
    }
  }
  return best;
}

export function renderPoints() {
  const groups = map.gPoints.selectAll('g.point-group')
    .data(state.data.points, d => d.id)
    .join(enter => {
      const g = enter.append('g').attr('class', 'point-group');
      g.append('circle')
        .attr('class', 'point')
        .attr('r', RADIUS)
        .on('click', onPointClick)
        .call(dragBehavior);
      g.append('text')
        .attr('class', 'point-label');
      return g;
    });

  groups.each(function (d) {
    const [x, y] = toScreen(d.lon, d.lat);
    const g = this;
    g.setAttribute('transform', `translate(${x},${y})`);
    const circle = g.querySelector('circle');
    circle.setAttribute('fill', d.color);
    circle.classList.toggle('selected',
      d.id === state.selectedPointId || d.id === state.connectFrom);
    const text = g.querySelector('text');
    text.textContent = d.label;
    const pos = (!d.labelPos || d.labelPos === 'auto') ? autoLabelPos(d) : d.labelPos;
    const [dx, dy, anchor] = LABEL_POS[pos] || LABEL_POS.right;
    text.setAttribute('dx', dx);
    text.setAttribute('dy', dy);
    text.setAttribute('text-anchor', anchor);
  });
}
