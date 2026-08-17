// Projection, country outlines, zoom and pan.
// Outlines live in gCountries, transformed by zoom.
// Points and links are drawn by other modules in screen coordinates
// (untransformed groups), so they do not scale with the map.

import { geoNaturalEarth1, geoPath } from 'https://cdn.jsdelivr.net/npm/d3-geo@3/+esm';
import { select } from 'https://cdn.jsdelivr.net/npm/d3-selection@3/+esm';
import { zoom, zoomIdentity } from 'https://cdn.jsdelivr.net/npm/d3-zoom@3/+esm';
import { feature } from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';

export const map = {
  svg: null,
  projection: null,
  transform: zoomIdentity,
  width: 0,
  height: 0,
  gLinks: null,
  gPoints: null,
};

const transformListeners = [];
export function onTransform(fn) { transformListeners.push(fn); }

// lon/lat -> screen pixels (zoom included)
export function toScreen(lon, lat) {
  return map.transform.apply(map.projection([lon, lat]));
}

// screen pixels -> lon/lat
export function toLonLat(x, y) {
  return map.projection.invert(map.transform.invert([x, y]));
}

export async function initMap(container) {
  const rect = container.getBoundingClientRect();
  map.width = rect.width;
  map.height = rect.height;

  // 50m: smoother outlines; 110m stays in data/ as a lower detail level for later
  const topo = await fetch('data/countries-50m.json').then(r => {
    if (!r.ok) throw new Error('Failed to load map data');
    return r.json();
  });
  const countries = feature(topo, topo.objects.countries);

  map.projection = geoNaturalEarth1().fitSize([map.width, map.height], countries);
  const path = geoPath(map.projection);

  map.svg = select(container).append('svg')
    .attr('width', map.width)
    .attr('height', map.height);

  // arrowhead — userSpaceOnUse so it does not scale with zoom
  map.svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('markerWidth', 10)
    .attr('markerHeight', 8)
    .attr('refX', 9)
    .attr('refY', 4)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,0 L10,4 L0,8 Z')
    .attr('fill', '#444');

  const gCountries = map.svg.append('g').attr('id', 'countries');
  map.gLinks = map.svg.append('g').attr('id', 'links');
  map.gPoints = map.svg.append('g').attr('id', 'points');

  gCountries.selectAll('path')
    .data(countries.features)
    .join('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('vector-effect', 'non-scaling-stroke');

  const zoomBehavior = zoom()
    .scaleExtent([1, 40])
    .on('zoom', (event) => {
      map.transform = event.transform;
      gCountries.attr('transform', event.transform);
      for (const fn of transformListeners) fn();
    });

  map.svg.call(zoomBehavior);
  map.svg.on('dblclick.zoom', null);

  return map;
}
