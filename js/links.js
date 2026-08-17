// Arrow connections between dots.
// A light arc from the edge of dot A to the edge of dot B, arrowhead at the end.

import { map, toScreen } from './map.js';
import { state, getPoint, selectLink } from './state.js';

const RADIUS = 6;      // dot radius
const GAP_END = 4;     // extra room for the arrowhead

// Arc path between two screen points, shortened at both ends.
function arcPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < RADIUS * 2 + GAP_END + 2) return null;

  // large radius = light arc
  const r = dist * 1.6;
  // arc opening angle and tangent correction at the endpoints
  const halfAngle = Math.asin(dist / (2 * r));
  const chordAngle = Math.atan2(dy, dx);
  const startAngle = chordAngle - halfAngle;
  const endAngle = chordAngle + halfAngle;

  const sx = x1 + Math.cos(startAngle) * RADIUS;
  const sy = y1 + Math.sin(startAngle) * RADIUS;
  const ex = x2 - Math.cos(endAngle) * (RADIUS + GAP_END);
  const ey = y2 - Math.sin(endAngle) * (RADIUS + GAP_END);

  return `M${sx},${sy} A${r},${r} 0 0 1 ${ex},${ey}`;
}

export function renderLinks() {
  map.gLinks.selectAll('path.link')
    .data(state.data.links, d => d.id)
    .join(enter => enter.append('path')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrowhead)')
      .on('click', (event, d) => {
        event.stopPropagation();
        selectLink(d.id);
      }))
    .classed('selected', d => d.id === state.selectedLinkId)
    .attr('d', d => {
      const from = getPoint(d.from);
      const to = getPoint(d.to);
      if (!from || !to) return null;
      const [x1, y1] = toScreen(from.lon, from.lat);
      const [x2, y2] = toScreen(to.lon, to.lat);
      return arcPath(x1, y1, x2, y2);
    });
}
