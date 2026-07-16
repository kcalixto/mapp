const TRIP_TYPES_CYCLE = [null, "bus-round", "bus-train-round", "train-oneway"];

const TRIP_CONFIG = {
  "bus-round": {
    cost: 5.3 * 2,
    label: "Ônibus I/V",
    bgClass: "bg-emerald-500",
    textClass: "text-white",
  },
  "bus-train-round": {
    cost: 9.38 * 2,
    label: "Ônibus+Trem I/V",
    bgClass: "bg-violet-500",
    textClass: "text-white",
  },
  "train-oneway": {
    cost: 5.4,
    label: "Trem (ida)",
    bgClass: "bg-amber-400",
    textClass: "text-gray-900",
  },
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

let currentYear;
let currentMonth0; // 0-indexed for Date constructor
let daySelections; // { "1": "bus-round", "5": null, ... }

// --- Storage ---

function storageKey() {
  const m = String(currentMonth0 + 1).padStart(2, "0");
  return `bilhete-unico-${currentYear}-${m}`;
}

function saveSelections() {
  localStorage.setItem(storageKey(), JSON.stringify(daySelections));
}

function loadSelections() {
  const raw = localStorage.getItem(storageKey());
  return raw ? JSON.parse(raw) : {};
}

// --- Calculation ---

function calcCalendarTotal() {
  return Object.values(daySelections).reduce((sum, tripType) => {
    if (!tripType) return sum;
    return sum + (TRIP_CONFIG[tripType]?.cost ?? 0);
  }, 0);
}

function updateCalendarTotalDisplay() {
  const total = calcCalendarTotal();
  document.getElementById("calendar-total-result").textContent =
    total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- Rendering ---

function renderLegend() {
  const container = document.getElementById("calendar-legend");
  container.innerHTML = "";

  for (const config of Object.values(TRIP_CONFIG)) {
    const pill = document.createElement("span");
    pill.className = `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`;
    pill.textContent = config.label;
    container.appendChild(pill);
  }
}

function buildDayClasses(tripType, isToday) {
  const base =
    "py-2 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer select-none ";

  if (tripType) {
    const cfg = TRIP_CONFIG[tripType];
    const ring = isToday ? "ring-2 ring-offset-1 ring-indigo-600 " : "";
    return base + ring + cfg.bgClass + " " + cfg.textClass;
  }

  if (isToday) {
    return base + "bg-indigo-600 text-white font-bold shadow-md";
  }

  return base + "text-gray-700 hover:bg-indigo-100";
}

function renderCalendar() {
  const today = new Date().getDate();

  document.getElementById("calendar-month-year").textContent =
    `${MONTH_NAMES[currentMonth0]} ${currentYear}`;

  const firstDayIndex = new Date(currentYear, currentMonth0, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth0 + 1, 0).getDate();

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "py-2";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const tripType = daySelections[String(day)] ?? null;
    const isToday = day === today;

    const cell = document.createElement("div");
    cell.textContent = day;
    cell.className = buildDayClasses(tripType, isToday);
    cell.addEventListener("click", () => handleDayClick(day));
    grid.appendChild(cell);
  }
}

// --- Interaction ---

function handleDayClick(day) {
  const key = String(day);
  const current = daySelections[key] ?? null;
  const idx = TRIP_TYPES_CYCLE.indexOf(current);
  const next = TRIP_TYPES_CYCLE[(idx + 1) % TRIP_TYPES_CYCLE.length];

  if (next === null) {
    delete daySelections[key];
  } else {
    daySelections[key] = next;
  }

  saveSelections();
  renderCalendar();
  updateCalendarTotalDisplay();
}

// --- Init ---

function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth0 = now.getMonth();
  daySelections = loadSelections();

  renderLegend();
  renderCalendar();
  updateCalendarTotalDisplay();
}

initCalendar();
