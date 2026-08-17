// localStorage (autosave), JSON export and import.

import { state, replaceData, newTripData, SCHEMA_VERSION } from './state.js';

const STORAGE_KEY = 'trip-planner-state';
let saveTimer = null;

export function autosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    } catch (e) {
      console.error('Autosave failed', e);
    }
  }, 400);
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!validate(data)) return false;
    replaceData(data);
    return true;
  } catch {
    return false;
  }
}

function validate(data) {
  return data
    && data.schemaVersion === SCHEMA_VERSION
    && data.trip && typeof data.trip.id === 'string'
    && Array.isArray(data.points)
    && Array.isArray(data.links);
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = (state.data.trip.title || 'trip').replace(/[^\p{L}\p{N}_-]+/gu, '_');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file, onError) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data.schemaVersion !== 'number') {
        onError('This file does not look like a saved trip.');
        return;
      }
      if (data.schemaVersion !== SCHEMA_VERSION) {
        onError(`Unknown file version (schemaVersion ${data.schemaVersion}, supported: ${SCHEMA_VERSION}).`);
        return;
      }
      if (!validate(data)) {
        onError('The file has an invalid structure.');
        return;
      }
      replaceData(data);
    } catch {
      onError('Could not parse the JSON file.');
    }
  };
  reader.readAsText(file);
}

export function newTrip() {
  replaceData(newTripData());
}
