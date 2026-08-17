// Budget mini-spreadsheet: Name and Amount columns, in-cell editing,
// always one empty row at the bottom for entering the next item.
// Entries live in state.data.budget, so they are autosaved and exported.

import { state, emit } from './state.js';

const popover = document.getElementById('budget-popover');
const rowsEl = document.getElementById('budget-rows');
const sumEl = document.getElementById('budget-sum');

function items() {
  if (!Array.isArray(state.data.budget)) state.data.budget = [];
  return state.data.budget;
}

function parseAmount(value) {
  const n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function renderSum() {
  const sum = items().reduce((acc, i) => acc + i.amount, 0);
  sumEl.textContent = sum.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function makeRow(item) {
  const row = document.createElement('div');
  row.className = 'budget-row';
  const isNew = !item;

  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'cell-name';
  name.spellcheck = false;
  name.placeholder = isNew ? 'new item…' : '';
  name.value = item?.label ?? '';

  const amount = document.createElement('input');
  amount.type = 'text';
  amount.className = 'cell-amount';
  amount.inputMode = 'decimal';
  amount.value = item ? String(item.amount) : '';

  const del = document.createElement('button');
  del.textContent = '×';
  del.tabIndex = -1;
  del.title = 'Delete row';
  del.disabled = isNew;
  del.addEventListener('click', () => {
    state.data.budget = items().filter(i => i.id !== item.id);
    emit('budget');
    renderBudget();
  });

  function onInput(field) {
    if (isNew) {
      // the first character typed into the empty row creates a new item
      const created = { id: crypto.randomUUID(), label: name.value, amount: parseAmount(amount.value) };
      items().push(created);
      emit('budget');
      renderBudget();
      // restore focus to the same cell of the now-existing row
      const rows = rowsEl.querySelectorAll('.budget-row');
      const target = rows[rows.length - 2]?.querySelector(field === 'name' ? '.cell-name' : '.cell-amount');
      if (target) {
        target.focus();
        target.setSelectionRange(target.value.length, target.value.length);
      }
      return;
    }
    if (field === 'name') item.label = name.value;
    else item.amount = parseAmount(amount.value);
    renderSum();
    emit('budget');
  }

  name.addEventListener('input', () => onInput('name'));
  amount.addEventListener('input', () => onInput('amount'));

  // Enter moves from name to amount, and from amount to the new row
  name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') amount.focus();
  });
  amount.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const rows = rowsEl.querySelectorAll('.budget-row');
      rows[rows.length - 1]?.querySelector('.cell-name')?.focus();
    }
  });

  row.append(name, amount, del);
  return row;
}

export function renderBudget() {
  if (popover.hidden) return;
  rowsEl.innerHTML = '';
  for (const item of items()) rowsEl.appendChild(makeRow(item));
  rowsEl.appendChild(makeRow(null)); // empty row at the bottom
  renderSum();
}

export function initBudget() {
  const btn = document.getElementById('budget-btn');

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    popover.hidden = !popover.hidden;
    if (!popover.hidden) {
      renderBudget();
      rowsEl.querySelector('.budget-row:last-child .cell-name')?.focus();
    }
  });

  // clicking outside closes the window
  document.addEventListener('click', (event) => {
    if (!popover.hidden && !popover.contains(event.target)) {
      popover.hidden = true;
    }
  });
}
