// Single state object + simple change notification.

export const SCHEMA_VERSION = 1;

export function newTripData(title = 'New trip') {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    trip: { id: crypto.randomUUID(), title, createdAt: now, updatedAt: now },
    points: [],
    links: [],
    budget: [],
  };
}

export const state = {
  data: newTripData(),
  selectedPointId: null,
  selectedLinkId: null,
  editMode: false, // view mode by default: only pan/zoom and reading notes
  connectMode: false,
  connectFrom: null, // id of point A while connecting
};

const listeners = [];

// on(fn) — fn(type) called after every change; type: 'points' | 'links' | 'trip' | 'budget' | 'selection' | 'replace'
export function on(fn) {
  listeners.push(fn);
}

export function emit(type) {
  if (type !== 'selection') {
    state.data.trip.updatedAt = new Date().toISOString();
  }
  for (const fn of listeners) fn(type);
}

// --- data operations ---

export function addPoint(lon, lat) {
  const point = {
    id: crypto.randomUUID(),
    lon: +lon.toFixed(4),
    lat: +lat.toFixed(4),
    label: '',
    color: '#e03131',
    note: '',
    order: state.data.points.length + 1,
  };
  state.data.points.push(point);
  emit('points');
  return point;
}

export function movePoint(id, lon, lat) {
  const p = getPoint(id);
  if (!p) return;
  p.lon = +lon.toFixed(4);
  p.lat = +lat.toFixed(4);
  emit('points');
}

export function deletePoint(id) {
  state.data.points = state.data.points.filter(p => p.id !== id);
  state.data.links = state.data.links.filter(l => l.from !== id && l.to !== id);
  if (state.selectedLinkId && !state.data.links.some(l => l.id === state.selectedLinkId)) {
    state.selectedLinkId = null;
  }
  state.data.points.forEach((p, i) => { p.order = i + 1; });
  if (state.selectedPointId === id) state.selectedPointId = null;
  if (state.connectFrom === id) state.connectFrom = null;
  emit('points');
  emit('selection');
}

export function getPoint(id) {
  return state.data.points.find(p => p.id === id);
}

export function selectPoint(id) {
  state.selectedPointId = id;
  state.selectedLinkId = null;
  emit('selection');
}

export function selectLink(id) {
  state.selectedLinkId = id;
  state.selectedPointId = null;
  emit('selection');
}

export function getLink(id) {
  return state.data.links.find(l => l.id === id);
}

export function addLink(fromId, toId) {
  if (fromId === toId) return;
  const exists = state.data.links.some(l => l.from === fromId && l.to === toId);
  if (exists) return;
  state.data.links.push({ id: crypto.randomUUID(), from: fromId, to: toId, label: '', note: '' });
  emit('links');
}

export function deleteLink(id) {
  state.data.links = state.data.links.filter(l => l.id !== id);
  if (state.selectedLinkId === id) state.selectedLinkId = null;
  emit('links');
  emit('selection');
}

export function replaceData(data) {
  state.data = data;
  state.selectedPointId = null;
  state.connectFrom = null;
  emit('replace');
  emit('selection');
}
