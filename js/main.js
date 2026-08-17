// Initialization and wiring of the modules.

import { initMap, onTransform } from './map.js';
import { initPoints, renderPoints } from './points.js';
import { renderLinks } from './links.js';
import { initNotes, renderPanel } from './notes.js';
import { initCalendar } from './calendar.js';
import { initBudget, renderBudget } from './budget.js';
import { autosave, loadSaved, exportJSON, importJSON, newTrip } from './storage.js';
import { state, on, emit, addPoint, selectPoint } from './state.js';

const statusBar = document.getElementById('status-bar');
const titleInput = document.getElementById('trip-title');
const connectBtn = document.getElementById('connect-mode');

function setStatus(msg) {
  statusBar.textContent = msg;
}

function renderAll() {
  renderLinks();
  renderPoints();
}

async function start() {
  await initMap(document.getElementById('map-container'));

  initPoints();
  initNotes();
  initCalendar();
  initBudget();
  loadSaved();

  // recompute positions on every transform change (constant dot and arrowhead size)
  onTransform(renderAll);

  on((type) => {
    if (type === 'trip') {
      titleInput.value = state.data.trip.title;
      return; // the title alone does not require a map render
    }
    renderAll();
    renderPanel();
    if (type === 'replace') {
      titleInput.value = state.data.trip.title;
      renderBudget();
    }
    if (type !== 'selection') autosave();
  });

  // --- toolbar ---
  titleInput.value = state.data.trip.title;
  titleInput.addEventListener('input', () => {
    state.data.trip.title = titleInput.value;
    emit('trip');
    autosave();
  });

  const editBtn = document.getElementById('edit-mode');
  editBtn.addEventListener('click', () => {
    state.editMode = !state.editMode;
    editBtn.classList.toggle('active', state.editMode);
    document.body.classList.toggle('edit-mode', state.editMode);
    if (!state.editMode) {
      // leaving edit mode also turns off connecting
      state.connectMode = false;
      state.connectFrom = null;
      connectBtn.classList.remove('active');
    }
    setStatus(state.editMode ? 'Edit mode: click the map to add a point.' : '');
    emit('selection');
  });

  connectBtn.addEventListener('click', () => {
    state.connectMode = !state.connectMode;
    state.connectFrom = null;
    connectBtn.classList.toggle('active', state.connectMode);
    setStatus(state.connectMode ? 'Connect mode: click point A, then point B.' : '');
    emit('selection');
  });

  document.getElementById('add-coord').addEventListener('click', () => {
    const input = document.getElementById('coord-input');
    const m = input.value.split(',').map(s => parseFloat(s.trim()));
    if (m.length !== 2 || m.some(isNaN)) {
      setStatus('Enter coordinates as "lat, lon", e.g. 47.01, 28.87');
      return;
    }
    // same order as Google Maps: lat, lon; if the first value exceeds 90 it must be lon
    let [lat, lon] = m;
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) [lat, lon] = [lon, lat];
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      setStatus('Coordinates out of range: lat ±90, lon ±180.');
      return;
    }
    const p = addPoint(lon, lat);
    selectPoint(p.id);
    input.value = '';
    setStatus('');
  });

  document.getElementById('export-btn').addEventListener('click', exportJSON);

  const fileInput = document.getElementById('import-file');
  document.getElementById('import-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) importJSON(file, setStatus);
    fileInput.value = '';
  });

  document.getElementById('new-trip').addEventListener('click', () => {
    if (confirm('Start a new trip? The current one will be removed from this browser.')) {
      newTrip();
    }
  });

  renderAll();
  renderPanel();
}

start().catch(err => {
  console.error(err);
  setStatus(`Error: ${err.message}`);
});
