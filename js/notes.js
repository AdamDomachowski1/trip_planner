// Note panel for the selected point or link.

import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12/+esm';
import { state, getPoint, getLink, deletePoint, deleteLink, emit } from './state.js';

const PALETTE = [
  '#e03131', '#e8590c', '#f08c00', '#2f9e44',
  '#1971c2', '#6741d9', '#c2255c', '#495057',
];

const panel = document.getElementById('note-panel');
const labelInput = document.getElementById('point-label');
const paletteEl = document.getElementById('color-palette');
const textArea = document.getElementById('note-text');
const previewEl = document.getElementById('note-preview');
const togglePreviewBtn = document.getElementById('toggle-preview');

let previewMode = false;
let debounceTimer = null;

// render markdown + open links in a new tab
function renderMarkdown(el, text) {
  el.innerHTML = marked.parse(text || '');
  for (const a of el.querySelectorAll('a')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
}

// selected point or link — the panel handles both
function current() {
  if (state.selectedPointId) return getPoint(state.selectedPointId);
  if (state.selectedLinkId) return getLink(state.selectedLinkId);
  return null;
}

function isLink() {
  return !state.selectedPointId && !!state.selectedLinkId;
}

function saveDebounced(apply) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const item = current();
    if (!item) return;
    apply(item);
    emit(isLink() ? 'links' : 'points');
  }, 500);
}

export function initNotes() {
  // color palette
  for (const color of PALETTE) {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener('click', () => {
      const p = current();
      if (!p || isLink()) return;
      p.color = color;
      emit('points');
      renderPanel();
    });
    paletteEl.appendChild(btn);
  }

  document.getElementById('label-pos').addEventListener('change', (event) => {
    const p = current();
    if (!p || isLink()) return;
    p.labelPos = event.target.value;
    emit('points');
  });

  labelInput.addEventListener('input', () => {
    saveDebounced(item => { item.label = labelInput.value; });
  });

  textArea.addEventListener('input', () => {
    saveDebounced(item => { item.note = textArea.value; });
  });

  togglePreviewBtn.addEventListener('click', () => {
    previewMode = !previewMode;
    togglePreviewBtn.textContent = previewMode ? 'Edit' : 'Preview';
    togglePreviewBtn.classList.toggle('active', previewMode);
    textArea.hidden = previewMode;
    previewEl.hidden = !previewMode;
    if (previewMode) {
      const item = current();
      renderMarkdown(previewEl, item?.note);
    }
  });

  document.getElementById('close-panel').addEventListener('click', () => {
    state.selectedPointId = null;
    state.selectedLinkId = null;
    emit('selection');
  });

  document.getElementById('delete-point').addEventListener('click', () => {
    if (state.selectedPointId) deletePoint(state.selectedPointId);
    else if (state.selectedLinkId) deleteLink(state.selectedLinkId);
  });
}

export function renderPanel() {
  const item = current();
  panel.hidden = !item;
  if (!item) return;

  const link = isLink();
  paletteEl.hidden = link;
  document.getElementById('label-pos-row').hidden = link;
  if (!link) document.getElementById('label-pos').value = item.labelPos || 'auto';
  document.getElementById('delete-point').textContent = link ? 'Delete connection' : 'Delete point';
  labelInput.placeholder = link ? linkTitle(item) : 'Point name';

  if (document.activeElement !== labelInput) labelInput.value = item.label;
  if (document.activeElement !== textArea) textArea.value = item.note || '';
  if (previewMode) renderMarkdown(previewEl, item.note);

  if (!link) {
    for (const swatch of paletteEl.children) {
      swatch.classList.toggle('selected', swatch.dataset.color === item.color);
    }
  }
}

// "A → B" as a hint about what this connection is
function linkTitle(l) {
  const name = id => getPoint(id)?.label || 'point';
  return `${name(l.from)} → ${name(l.to)}`;
}
