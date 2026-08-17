// Quick month calendar — a planning aid, no state is stored.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const popover = document.getElementById('calendar-popover');
const titleEl = document.getElementById('cal-title');
const gridEl = document.getElementById('cal-grid');

let shown = new Date(); // first day of the displayed month

function render() {
  const year = shown.getFullYear();
  const month = shown.getMonth();
  titleEl.textContent = `${MONTHS[month]} ${year}`;

  gridEl.innerHTML = '';
  for (const wd of WEEKDAYS) {
    const el = document.createElement('span');
    el.className = 'cal-weekday';
    el.textContent = wd;
    gridEl.appendChild(el);
  }

  // Monday as the first day of the week
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstWeekday; i++) {
    gridEl.appendChild(document.createElement('span'));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const el = document.createElement('span');
    el.className = 'cal-day';
    el.textContent = day;
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      el.classList.add('cal-today');
    }
    gridEl.appendChild(el);
  }
}

export function initCalendar() {
  const btn = document.getElementById('calendar-btn');

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    popover.hidden = !popover.hidden;
    if (!popover.hidden) {
      shown = new Date();
      shown.setDate(1);
      render();
    }
  });

  document.getElementById('cal-prev').addEventListener('click', () => {
    shown.setMonth(shown.getMonth() - 1);
    render();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    shown.setMonth(shown.getMonth() + 1);
    render();
  });

  // clicking outside closes the calendar
  document.addEventListener('click', (event) => {
    if (!popover.hidden && !popover.contains(event.target)) {
      popover.hidden = true;
    }
  });
}
