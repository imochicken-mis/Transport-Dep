// ===================================================================
// VEHICLE MONITORING SYSTEM — Frontend Application
// ===================================================================

// ===================================================================
// 1. GLOBAL STATE
// ===================================================================
const cache = {};
let dashboardLoaded_ = false;
let activeModuleKey = null;
let currentVehicleLookup_ = null;
let map, markersLayer;
let fleetCostData_ = null;
const moduleTargets = {};
const chartZoomLevels_ = {};
let usersCache_ = null;
const pendingChanges_ = {};

// ⬇️ මේක අලුතෙන් එකතු කරන්න ⬇️
const chartCategoryVisibility_ = {
  fuel: true,
  lube: true,
  service: true,
  repair: true,
};

const fuelComboVisibility_ = {
  diesel: true,
  petrol: true,
  cost: true,
};


// ===================================================================
// 2. MODULE DEFINITIONS
// ===================================================================
const MODULES = {
  vehicles: {
    sheet: "Vehicles",
    title: "Vehicle Master",
    singular: "New Vehicle",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "Vehicle No", label: "Vehicle No", type: "text", required: true },
      { key: "Type", label: "Type", type: "text" },
      { key: "Model", label: "Model", type: "text" },
      { key: "Make", label: "Make", type: "text" },
      { key: "Year", label: "Year", type: "text" },
      { key: "ChassisNo", label: "Chassis No", type: "text" },
      { key: "EngineNo", label: "Engine No", type: "text" },
      { key: "CurrentOwner", label: "Current Owner", type: "text" },
      { key: "Department", label: "Department", type: "text" },
      { key: "User", label: "User/Driver", type: "text" },
      { key: "Status", label: "Status", type: "select", options: ["Active", "In Service", "Inactive"] },
    ],
  },
  drivers: {
    sheet: "Drivers",
    title: "Driver Master",
    singular: "New Driver",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "Name", label: "User Name", type: "text", required: true },
      { key: "NICNO", label: "NIC Number", type: "text" },
      { key: "Phone", label: "Phone", type: "text" },
      { key: "Address", label: "Home Address", type: "text" },
      { key: "License", label: "License No", type: "text" },
      { key: "LicenseExpiryDate", label: "License Expiry Date", type: "date" },
      { key: "AssignedVehicle", label: "Assigned Plate No", type: "text" },
      { key: "Department", label: "Department", type: "text" },
    ],
  },
  fuel: {
    sheet: "FuelLogs",
    title: "Fuel Management",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "VehicleID", label: "Vehicle No", type: "text", required: true },
      { key: "Date", label: "Date", type: "date" },
      { key: "Fueltype", label: "Fuel Type", type: "select", options: ["Diesel", "Petrol"] },
      { key: "Fuelcategory", label: "Fuel Category", type: "select", options: ["Auto", "Super", "92 Octane", "95 Octane"] },
      { key: "Liters", label: "Quantity (Ltr)", type: "text" },
      { key: "Cost", label: "Cost (Rs.)", type: "text" },
      { key: "Odometer", label: "Odometer (km)", type: "text" },
      { key: "Location", label: "Location", type: "select", options: ["In Side", "Out Side"] },
    ],
  },
  serviceRecords: {
    sheet: "Maintenance",
    title: "Service Records",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "VehicleID", label: "Vehicle No", type: "text", required: true },
      { key: "ServiceType", label: "Service Type", type: "select", options: ["Full Service", "Half Service"] },
      { key: "Date", label: "Date", type: "date" },
      { key: "Cost", label: "Cost (Rs.LKR)", type: "text" },
      { key: "NextDueDate", label: "Next Due (Date)", type: "date" },
      { key: "NextDueKM", label: "Next Due (Km)", type: "text" },
    ],
  },
  repairParts: {
    sheet: "Repair",
    title: "Repair Records",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "VehicleID", label: "Vehicle No", type: "text", required: true },
      { key: "Date", label: "Date", type: "date", required: true },
      { key: "RepairArea", label: "Repair Area", type: "select", options: ["-", "Engine System", "Brake System", "Light System", "Electrical System", "Suspension System", "AC System", "Body/Chassis", "Other"] },
      { key: "Repair", label: "Repair", type: "text" },
      { key: "Cost", label: "Cost", type: "number" },
      { key: "Remarks", label: "Remarks", type: "text" },
    ],
  },
  License: {
    sheet: "License",
    title: "License Records",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "VehicleID", label: "Vehicle No", type: "text", required: true },
      { key: "LicenseNo", label: "License No", type: "text" },
      { key: "FromDate", label: "From Date", type: "date" },
      { key: "ToDate", label: "To Date", type: "date" },
      { key: "LicenseExpiry", label: "Days to Expiry", type: "text", auto: true, computedFrom: "ToDate" },
      { key: "Cost", label: "Cost (Rs.LKR)", type: "number" },
    ],
  },
  Insurance: {
    sheet: "Insurance",
    title: "Insurance Records",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "VehicleID", label: "Vehicle No", type: "text", required: true },
      { key: "InsuranceCompany", label: "Insurance Co.", type: "select", options: ["-", "Ceylinco General", "Continental", "HNB General", "Sri Lanka Insurance"] },
      { key: "Type", label: "Type", type: "select", options: ["-", "Full", "3rd Party"] },
      { key: "PolicyNo", label: "Policy No", type: "text" },
      { key: "FromDate", label: "From Date", type: "date" },
      { key: "ToDate", label: "To Date", type: "date" },
      { key: "InsuranceExpiry", label: "Days to Expiry", type: "text", auto: true, computedFrom: "ToDate" },
      { key: "Cost", label: "Cost (Rs.LKR)", type: "number" },
    ],
  },
  Lubricant: {
    sheet: "Lubricant",
    title: "Lubricant Management",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "VehicleID", label: "Vehicle No", type: "text" },
      { key: "Date", label: "Date", type: "date" },
      { key: "Category", label: "Lubricant Category", type: "select", options: ["-", "Engine Oil", "Gear Oil"] },
      { key: "Model", label: "Lubricant Model", type: "select", options: ["-", "Delo", "Velvoline"] },
      { key: "Quantity", label: "Quantity (Ltr)", type: "text" },
      { key: "Cost", label: "Cost (Rs.LKR)", type: "number" },
      { key: "Odometer", label: "Odometer", type: "number" },
    ],
  },
  Accident: {
    sheet: "Accident",
    title: "Accident Recorder",
    singular: "New Record",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "AccidentDate", label: "Accident Date", type: "date" },
      { key: "VehicleID", label: "Vehicle No", type: "text" },
      { key: "Driver", label: "Driver Name", type: "text" },
      { key: "AccidentLocation", label: "Accident Location", type: "text" },
      { key: "AccidentType", label: "Accident Type", type: "text" },
      { key: "Severity", label: "Severity", type: "text" },
      { key: "DamageCost", label: "Damage Cost (Rs.LKR)", type: "number" },
      { key: "Status ", label: "Status", type: "text" },
      { key: "PoliceReportNo", label: "Police Report No", type: "text" },
      { key: "InsuranceClaimNo", label: "Insurance Claim No", type: "text" },
      { key: "Remarks", label: "Remarks", type: "text" },
    ],
  },
  bookings: {
    sheet: "Bookings",
    title: "Vehicle Booking",
    singular: "New Booking",
    idField: "ID",
    fields: [
      { key: "ID", label: "ID", auto: true },
      { key: "Vehicle No", label: "Vehicle No", type: "text", required: true },
      { key: "Driver Name", label: "Driver Name", type: "text" }, // ⬅️ මේක අලුතෙන් එකතු කළා
      { key: "Requested By", label: "Requested By", type: "text", required: true },
      { key: "Department", label: "Department", type: "text" },
      { key: "From Date", label: "From Date", type: "date", required: true },
      { key: "From Time", label: "From Time (e.g. 08:00)", type: "time", required: true },
      { key: "To Date", label: "To Date", type: "date", required: true },
      { key: "To Time", label: "To Time (e.g. 17:00)", type: "time", required: true },
      { key: "Destination", label: "Destination", type: "text" },
      { key: "Purpose", label: "Purpose", type: "text" },
    ],
  },
};

// ===================================================================
// 3. AUTO-MANAGED TIMESTAMP FIELDS
// ===================================================================
Object.values(MODULES).forEach((mod) => {
  const hasField = (k) => mod.fields.some((f) => f.key === k);

  if (!hasField("Enterd Date & Time")) {
    mod.fields.push({ key: "Enterd Date & Time", label: "Entered Date & Time", auto: true, hidden: true });
  }
  if (!hasField("Entered By")) {
    mod.fields.push({ key: "Entered By", label: "Entered By", auto: true, hidden: true });
  }
  if (!hasField("Last Edit Date")) {
    mod.fields.push({ key: "Last Edit Date", label: "Last Edit Date", auto: true, hidden: true });
  }
});


// ===================================================================
// 4. AUTH / PERMISSIONS / LOGOUT
// ===================================================================
const currentUser = JSON.parse(sessionStorage.getItem("vms_user") || "null");
if (currentUser) {
  document.getElementById("footUser").textContent = `${currentUser.username} (${currentUser.role || "Staff"})`;
}

function applyTabPermissions_(user) {
  const allowed = (user.allowedTabs || []).map((t) => t.toLowerCase());
  if (allowed.length === 0) return;

  let firstAllowedKey = null;
  document.querySelectorAll(".nav-item").forEach((btn) => {
    const key = btn.dataset.view;
    if (allowed.includes(key.toLowerCase())) {
      if (!firstAllowedKey) firstAllowedKey = key;
    } else {
      btn.style.display = "none";
    }
  });

  if (!allowed.includes("dashboard") && firstAllowedKey) {
    showView(firstAllowedKey);
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  sessionStorage.removeItem("vms_user");
  window.location.href = "login.html";
});


// ===================================================================
// 5. NAVIGATION / SIDEBAR
// ===================================================================
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("viewTitle");
const sidebar = document.getElementById("sidebar");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

if (currentUser) applyTabPermissions_(currentUser);

document.getElementById("hamburgerBtn")?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

const sidebarToggleBtn = document.getElementById("sidebarToggle");
if (sidebarToggleBtn) {
  const isCollapsed = localStorage.getItem("vms_sidebar_collapsed") === "true";
  if (isCollapsed) {
    document.querySelector(".app-shell").classList.add("sidebar-collapsed");
    document.getElementById("sidebar").classList.add("collapsed");
  }

  sidebarToggleBtn.addEventListener("click", () => {
    const shell = document.querySelector(".app-shell");
    const sidebarEl = document.getElementById("sidebar");

    shell.classList.toggle("sidebar-collapsed");
    sidebarEl.classList.toggle("collapsed");

    const collapsed = shell.classList.contains("sidebar-collapsed");
    localStorage.setItem("vms_sidebar_collapsed", collapsed ? "true" : "false");

    setTimeout(() => {
      if (window.map && typeof window.map.invalidateSize === "function") {
        window.map.invalidateSize();
      }
    }, 320);
  });
}

// ===================================================================
// DASHBOARD TABS LOGIC (Overall / Individual)
// ===================================================================
document.addEventListener("DOMContentLoaded", () => {
  const tabBtns = document.querySelectorAll(".dash-tab-btn");
  const fleetSection = document.getElementById("dash-fleet-section");
  const vehicleSection = document.getElementById("dash-vehicle-section");

  if (tabBtns.length > 0 && fleetSection && vehicleSection) {
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const target = btn.dataset.target;
        if (target === "fleet") {
          fleetSection.style.display = "block";
          vehicleSection.style.display = "none";
        } else {
          fleetSection.style.display = "none";
          vehicleSection.style.display = "block";
        }
      });
    });
  }
});

function showView(key) {
  navItems.forEach((b) => b.classList.toggle("active", b.dataset.view === key));
  views.forEach((v) => v.classList.toggle("active", v.id === `view-${key}`));
  const navLabel = document.querySelector(`.nav-item[data-view="${key}"]`);
  viewTitle.textContent = navLabel ? navLabel.textContent.trim() : key;
  sidebar.classList.remove("open");

  if (key === "maintenance") { renderMaintenanceGroup(); }
  else if (key === "licenseInsurance") { renderLicenseInsuranceGroup(); }
  // ✅ bookings සඳහා Table එක හදන්නේ නැතුව, Calendar එක විතරක් හදන්න
  else if (key === "bookings") { loadBookingsView(); } 
  else if (MODULES[key]) renderModule(key);

  if (key === "dashboard" && !dashboardLoaded_) loadDashboard();
  if (key === "tracking") loadTracking();
}


// ===================================================================
// 6. FORMATTERS
// ===================================================================
function formatNumber_(value) {
  const n = Number(value);
  if (isNaN(n)) return value ?? "";
  return "Rs. " + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatLiters_(value) {
  const n = Number(value);
  if (isNaN(n)) return value ?? "0.00";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayISO_() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


// ===================================================================
// 7. CRUD RENDERER
// ===================================================================
async function renderModule(key, targetId) {
  const mod = MODULES[key];
  const resolvedTarget = targetId || `view-${key}`;
  moduleTargets[key] = resolvedTarget;
  const root = document.getElementById(resolvedTarget);

  if (root.dataset.renderedKey === key) return;
  root.dataset.renderedKey = key;

  let cardsHtml = "";
  if (key === "vehicles") {
    cardsHtml = `<div id="vehicleStatsCards" class="stats-card-container"></div>`;
  } else if (key === "fuel") {
    cardsHtml = `<div id="fuelOverview" class="fuel-overview"></div>`;
  }

  root.innerHTML = `
    <div class="view-head"><h1>${mod.title}</h1></div>
    ${cardsHtml}
    <div class="toolbar">
      <input type="search" placeholder="Search ${mod.title.toLowerCase()}…" id="search-${key}">
      <button class="btn btn-amber" id="addBtn-${key}">+ Add ${mod.singular || mod.title.slice(0, -1)}</button>
    </div>
    <div class="panel"><div class="panel-body table-scroll">
      <table><thead><tr>
        ${mod.fields.filter((f) => !f.hidden).map((f) => `<th>${f.label}</th>`).join("")}
        <th></th>
      </tr></thead>
      <tbody id="tbody-${key}">
        <tr><td colspan="${mod.fields.filter((f) => !f.hidden).length + 1}">Loading…</td></tr>
      </tbody>
      </table>
    </div></div>`;

  document.getElementById(`addBtn-${key}`).addEventListener("click", () => openForm(key));
  document.getElementById(`search-${key}`).addEventListener("input", (e) => paintRows(key, e.target.value));

  try {
    const rows = await Api.list(mod.sheet);
    cache[mod.sheet] = rows;
    paintRows(key, "");

    if (key === "vehicles") renderVehicleStatsCards();
    if (key === "fuel") renderFuelOverview();

    root.dataset.rendered = "true";
  } catch (err) {
    document.getElementById(`tbody-${key}`).innerHTML =
      `<tr><td colspan="${mod.fields.filter((f) => !f.hidden).length + 1}">❌ Couldn't load data — ${err.message}</td></tr>`;
  }
}

function paintRows(key, filterText) {
  const mod = MODULES[key];
  const rows = (cache[mod.sheet] || []).filter((r) =>
    JSON.stringify(r).toLowerCase().includes(filterText.toLowerCase())
  );
  const tbody = document.getElementById(`tbody-${key}`);
  const colCount = mod.fields.filter((f) => !f.hidden).length + 1;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${colCount}">No records yet.</td></tr>`;
    return;
  }

  const noEditTabs = (currentUser && currentUser.noEditTabs) || [];
  const noDeleteTabs = (currentUser && currentUser.noDeleteTabs) || [];
  const canEdit = !noEditTabs.includes(key.toLowerCase());
  const canDelete = !noDeleteTabs.includes(key.toLowerCase());

  tbody.innerHTML = rows
    .map(
      (r) => `<tr data-id="${r[mod.idField]}">
        ${mod.fields.filter((f) => !f.hidden).map((f) => `<td>${statusCell(f, r[f.key])}</td>`).join("")}
        <td class="row-actions">
          ${canEdit ? `<button title="Edit" onclick='openForm("${key}", ${JSON.stringify(r).replace(/'/g, "&apos;")})'>✎</button>` : ""}
          ${canDelete ? `<button title="Delete" onclick='removeRow("${key}", "${r[mod.idField]}")'>🗑</button>` : ""}
        </td>
      </tr>`
    )
    .join("");
}

function renderSingleRow(key, row) {
  const mod = MODULES[key];
  const noEditTabs = (currentUser && currentUser.noEditTabs) || [];
  const noDeleteTabs = (currentUser && currentUser.noDeleteTabs) || [];
  const canEdit = !noEditTabs.includes(key.toLowerCase());
  const canDelete = !noDeleteTabs.includes(key.toLowerCase());

  return `<tr data-id="${row[mod.idField]}">
    ${mod.fields.filter((f) => !f.hidden).map((f) => `<td>${statusCell(f, row[f.key])}</td>`).join("")}
    <td class="row-actions">
      ${canEdit ? `<button title="Edit" onclick='openForm("${key}", ${JSON.stringify(row).replace(/'/g, "&apos;")})'>✎</button>` : ""}
      ${canDelete ? `<button title="Delete" onclick='removeRow("${key}", "${row[mod.idField]}")'>🗑</button>` : ""}
    </td>
  </tr>`;
}

function statusCell(field, value) {
  if (field.key === "Status" && value) {
    const map = { Active: "badge-green", "In Service": "badge-amber", Inactive: "badge-red" };
    return `<span class="badge ${map[value] || "badge-green"}">${value}</span>`;
  }
  if (field.key === "Cost" && value !== "" && value !== undefined) {
    return formatNumber_(value);
  }
  return value ?? "";
}


// ===================================================================
// 8. MODAL FORM
// ===================================================================
const modalBackdrop = document.getElementById("modalBackdrop");
const modalForm = document.getElementById("modalForm");
const modalTitle = document.getElementById("modalTitle");
document.getElementById("modalCloseBtn")?.addEventListener("click", closeForm);

async function openForm(key, existing) {
  activeModuleKey = key;
  const mod = MODULES[key];
  const singularName = mod.singular || mod.title.slice(0, -1);
  modalTitle.textContent = existing ? `Edit ${singularName}` : `Add ${singularName}`;

  // ✅ Booking Form එකට Driver Dropdown එක හදන්න
  if (key === "bookings") {
    try {
      const drivers = await Api.list("Drivers");
      cache.Drivers = drivers;
      const driverNames = drivers.map(d => d.Name).filter(Boolean);
      
      const driverField = mod.fields.find(f => f.key === "Driver Name");
      if (driverField) {
        driverField.type = "select"; // text වෙනුවට select කරන්න
        driverField.options = ["", ...driverNames]; // මුලින්ම හිස් එකක්, ඊට පස්සේ නම්
      }
    } catch (err) {
      console.warn("Drivers load failed", err);
    }
  }

  modalForm.innerHTML =
    mod.fields
      .filter((f) => !f.auto)
      .map((f) => {
        const val = existing ? existing[f.key] ?? "" : "";
        if (f.type === "select") {
          return `<label class="field"><span>${f.label}</span>
            <select name="${f.key}">${f.options.map((o) => `<option ${o === val ? "selected" : ""}>${o}</option>`).join("")}</select>
          </label>`;
        }
        if (f.type === "date") {
          const dateVal = val || (!existing ? todayISO_() : "");
          return `<label class="field"><span>${f.label}</span>
            <input type="date" name="${f.key}" value="${dateVal}" ${f.required ? "required" : ""}>
          </label>`;
        }
        if (f.type === "time") {
          return `<label class="field"><span>${f.label}</span>
            <input type="time" name="${f.key}" value="${val}" ${f.required ? "required" : ""}>
          </label>`;
        }
        return `<label class="field"><span>${f.label}</span>
          <input name="${f.key}" value="${val}" ${f.required ? "required" : ""}>
        </label>`;
      })
      .join("") +
    `<button class="btn btn-primary" type="submit" id="modalSubmitBtn">${existing ? "Save changes" : "Add"}</button>`;

  if (existing) modalForm.dataset.id = existing[mod.idField];
  else delete modalForm.dataset.id;

  const computedField = mod.fields.find((f) => f.computedFrom);
  if (computedField) {
    const sourceInput = modalForm.querySelector(`[name="${computedField.computedFrom}"]`);
    if (sourceInput) {
      if (existing && existing[computedField.key] !== undefined) {
        modalForm.dataset[computedField.key] = existing[computedField.key];
      }
      const updateDaysLeft_ = () => {
        if (!sourceInput.value) {
          delete modalForm.dataset[computedField.key];
          return;
        }
        const toDate = new Date(sourceInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((toDate - today) / 86400000);
        modalForm.dataset[computedField.key] = daysLeft;

        const displayField = modalForm.querySelector(`[name="${computedField.key}"]`);
        if (displayField && displayField.type === "text") {
          displayField.value = daysLeft;
          displayField.readOnly = true;
          displayField.style.background = "#f0f0f0";
        }
      };
      sourceInput.addEventListener("change", updateDaysLeft_);
      sourceInput.addEventListener("input", updateDaysLeft_);
      updateDaysLeft_();
    }
  }

  modalBackdrop.classList.add("open");
}

function closeForm() {
  modalBackdrop.classList.remove("open");
  modalForm.reset();
}

function clearModalFormForNextEntry_() {
  const mod = MODULES[activeModuleKey];
  if (!mod) return;

  modalForm.reset();
  delete modalForm.dataset.id;

  mod.fields.filter((f) => !f.auto).forEach((f) => {
    const el = modalForm.querySelector(`[name="${f.key}"]`);
    if (!el) return;

    if (f.type === "date") {
      el.value = todayISO_();
    } else if (f.type === "select") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });

  const computedField = mod.fields.find((f) => f.computedFrom);
  if (computedField) {
    delete modalForm.dataset[computedField.key];
    const sourceInput = modalForm.querySelector(`[name="${computedField.computedFrom}"]`);
    if (sourceInput && sourceInput.value) {
      sourceInput.dispatchEvent(new Event("change"));
    }
  }

  const firstInput = modalForm.querySelector("input:not([readonly]):not([type=date]), select, input");
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function showModalSavedToast_() {
  const head = modalForm.previousElementSibling;
  if (!head) return;

  let toast = head.querySelector(".modal-save-toast");
  if (!toast) {
    toast = document.createElement("span");
    toast.className = "modal-save-toast";
    head.appendChild(toast);
  }
  toast.textContent = "Saved ✓";
  toast.classList.add("show");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove("show"), 1400);
}

modalForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = modalForm.querySelector("#modalSubmitBtn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  const mod = MODULES[activeModuleKey];
  const formData = new FormData(modalForm);
  const data = Object.fromEntries(formData.entries());

  const computedField = mod.fields.find((f) => f.computedFrom);
  if (computedField && modalForm.dataset[computedField.key] !== undefined) {
    data[computedField.key] = modalForm.dataset[computedField.key];
  }

  Object.keys(data).forEach((key) => {
    if (data[key] === "") delete data[key];
  });

  try {
    let response = null;
    const isUpdate = !!modalForm.dataset.id;
    const username = (currentUser && currentUser.username) || "";

    if (isUpdate) {
      data[mod.idField] = modalForm.dataset.id;
      await Api.update(mod.sheet, data, username);
    } else {
      // ✅ අලුත් Booking එකක් නම් Status එක "Pending" කරන්න
      if (activeModuleKey === "bookings") {
        data["Status"] = "Pending";
        data["Approved By"] = "";
      }

      response = await Api.add(mod.sheet, data, username);
      data[mod.idField] = response.id;

      const tz = "Asia/Colombo";
      const now = new Date().toLocaleString("sv-SE", { timeZone: tz }).replace("T", " ").slice(0, 19);
      if (mod.fields.some((f) => f.key === "Enterd Date & Time")) data["Enterd Date & Time"] = now;
      if (mod.fields.some((f) => f.key === "Entered By")) data["Entered By"] = username;
      if (mod.fields.some((f) => f.key === "Last Edit Date")) data["Last Edit Date"] = "";
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    if (isUpdate) {
      closeForm();
    } else {
      clearModalFormForNextEntry_();
      showModalSavedToast_();
    }

        // ----- ඉතිරි Cache / DOM Update Logic එක -----
    const key = activeModuleKey;

    // ✅ අලුත් වෙනස්කම: Booking නම් Table එකට දත්ත දාන්නේ නැතුව Calendar එක Refresh කරන්න
    if (key === "bookings") {
      loadBookingsView(); // Calendar එක අලුත් කරනවා
    } else {
      // අනිත් සාමාන්‍ය Tabs වලට (Vehicles, Fuel, etc.) දත්ත දාන්නේ මෙතනින්
      const searchInput = document.getElementById(`search-${key}`);
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
      const tbody = document.getElementById(`tbody-${key}`);

      if (isUpdate) {
        const cacheIndex = cache[mod.sheet].findIndex((r) => String(r[mod.idField]) === String(data.id));
        if (cacheIndex !== -1) cache[mod.sheet][cacheIndex] = data;

        const existingRow = tbody.querySelector(`tr[data-id="${data.id}"]`);
        if (existingRow) {
          existingRow.outerHTML = renderSingleRow(key, data);
        } else {
          cache[mod.sheet] = await Api.list(mod.sheet);
          paintRows(key, searchInput ? searchInput.value : "");
        }
      } else {
        cache[mod.sheet].push(data);
        const rowString = JSON.stringify(data).toLowerCase();
        if (rowString.includes(searchTerm)) {
          tbody.insertAdjacentHTML("beforeend", renderSingleRow(key, data));
        }
      }
    }

    // අනිත් Charts ටික අලුත් කරන්න
    if (key === "vehicles") renderVehicleStatsCards();
    if (key === "fuel") renderFuelOverview();
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    alert("Couldn't save: " + err.message);
  }
});

async function removeRow(key, id) {
  const mod = MODULES[key];
  if (!confirm("Delete this record?")) return;
  try {
    await Api.remove(mod.sheet, id);

    const cacheIndex = cache[mod.sheet].findIndex((r) => String(r[mod.idField]) === String(id));
    if (cacheIndex !== -1) cache[mod.sheet].splice(cacheIndex, 1);

    const tbody = document.getElementById(`tbody-${key}`);
    const rowToRemove = tbody.querySelector(`tr[data-id="${id}"]`);
    if (rowToRemove) rowToRemove.remove();

    if (key === "vehicles") renderVehicleStatsCards();
    if (key === "fuel") renderFuelOverview();
  } catch (err) {
    alert("Couldn't delete: " + err.message);
  }
}


// ===================================================================
// 9. DASHBOARD
// ===================================================================
async function loadDashboard() {
  const gaugeRow = document.getElementById("gaugeRow");
  gaugeRow.innerHTML = `<div class="hint">Loading fleet summary…</div>`;
  
  try {
    // ✅ සියලුම දත්ත එකවර (Parallel) ගන්නවා
    const [vehicles, maintenance, fuel, lubricant, repair, license, insurance] = await Promise.all([
      Api.list("Vehicles"),
      Api.list("Maintenance"),
      Api.list("FuelLogs"),
      Api.list("Lubricant"),
      Api.list("Repair"),
      Api.list("License"),
      Api.list("Insurance"),
    ]);
    
    // Cache එකට දානවා
    cache.Vehicles = vehicles;
    cache.Maintenance = maintenance;
    cache.FuelLogs = fuel;
    cache.Lubricant = lubricant;
    cache.Repair = repair;
    cache.License = license;
    cache.Insurance = insurance;

    const total = vehicles.length || 1;
    const active = vehicles.filter((v) => v.Status === "Active").length;
    const inService = vehicles.filter((v) => v.Status === "In Service").length;
    const inactive = vehicles.filter((v) => v.Status === "Inactive").length;

    const typeCounts = {};
    vehicles.forEach((v) => {
      const t = v.Type || "Unspecified";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const typeRows = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

    const vehiclesByStatus_ = (status) =>
      vehicles.filter((v) => v.Status === status).map((v) => [v["Vehicle No"], v.Type || "—"]);

    const typeCountsByStatus_ = (status) => {
      const counts = {};
      vehicles.filter((v) => v.Status === status).forEach((v) => {
        const t = v.Type || "Unspecified";
        counts[t] = (counts[t] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    gaugeRow.innerHTML = `
      ${gauge("All vehicles", vehicles.length, Math.max(vehicles.length, 1), "#004dc9", typeRows, "gauge-blue")}
      ${gauge("Active", active, total, "#1cda19", typeCountsByStatus_("Active"), "gauge-green")}
      ${gauge("Inactive", inactive, total, "#d20000", vehiclesByStatus_("Inactive"), "gauge-red")}
      ${gauge("In service", inService, total, "#ff9900", vehiclesByStatus_("In Service"), "gauge-amber")}
    `;

    // ✅ දත්ත ඔක්කොම ආවට පස්සේ, Charts ටික එකවර Render කරනවා
    initVehicleLookup_();
    loadFleetFuelChart_();
    loadExpiringPanels_();
    loadFleetTotalCostChart_();

    dashboardLoaded_ = true;
    
  } catch (err) {
    gaugeRow.innerHTML = `<div class="hint">❌ Couldn't load summary — ${err.message}</div>`;
  }
}

function gauge(label, value, max, color, tooltipRows, cardClass) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const cardHtml = `<div class="gauge-card ${cardClass || ""}">
    <div class="gauge" style="--pct:${pct}; --ring-color:${color}"><span>${pct}%</span></div>
    <div><div class="gauge-label">${label}</div><div class="gauge-value">${value}</div></div>
  </div>`;

  if (!tooltipRows || !tooltipRows.length) return cardHtml;

  const tooltipHtml = `<div class="gauge-tooltip">
    <div class="tip-title">${label} — details</div>
    ${tooltipRows.map(([k, v]) => `<div class="tip-row"><span>${k}</span><span>${v}</span></div>`).join("")}
  </div>`;

  return `<div class="gauge-card-wrap">${cardHtml}${tooltipHtml}</div>`;
}

function getVehicleTypeIcon(categoryKey) {
  const map = {
    Bikes: "🏍️",
    "Luxury Vehicles": "🚗",
    "Vans & Bus": "🚐",
    Lorry: "🚛",
    "Land Vehicles": "🚜",
  };
  return map[categoryKey] || "🚗";
}

function renderVehicleStatsCards() {
  const container = document.getElementById("vehicleStatsCards");
  if (!container) return;

  const vehicles = cache.Vehicles || [];

  const categories = [
    { key: "Bikes", types: ["bike"], label: "Motor Bikes" },
    { key: "Luxury Vehicles", types: ["car", "jeep", "cab", "suv"], label: "Light Vehicles" },
    { key: "Vans & Bus", types: ["van", "bus"], label: "Vans & Buses (transport)" },
    { key: "Lorry", types: ["lorry", "truck"], label: "Freezer Trucks & Lorries" },
    { key: "Land Vehicles", types: ["tractor", "excavator", "jcb", "backhoe"], label: "Land Vehicles" },
  ];

  let html = `<div class="stats-row">`;

  categories.forEach((cat) => {
    const filtered = vehicles.filter((v) => {
      const type = String(v.Type ?? "").toLowerCase().trim();
      return cat.types.some((t) => type.includes(t));
    });

    const total = filtered.length;
    const models = new Set(filtered.map((v) => String(v.Model ?? "").toLowerCase().trim()).filter((m) => m !== ""));
    const modelCount = models.size;

    const activeCount = filtered.filter((v) => (v.Status || "").trim() === "Active").length;
    const inServiceCount = filtered.filter((v) => (v.Status || "").trim() === "In Service").length;
    const inactiveCount = filtered.filter((v) => (v.Status || "").trim() === "Inactive").length;

    html += `
      <div class="stat-card accent-${cat.key.toLowerCase().replace(/[^a-z]/g, "")}">
        <div class="stat-icon">${getVehicleTypeIcon(cat.key)}</div>
        <div class="stat-content">
          <div class="stat-title">${cat.label}</div>
          <div class="stat-numbers">
            <span class="stat-total">${total}</span>
            <span class="stat-label">Vehicles</span>
            <span class="stat-models">${modelCount} Models</span>
          </div>
          <div class="stat-status-row">
            <span class="stat-status active"><span class="dot-status"></span>${activeCount}</span>
            <span class="stat-status inservice"><span class="dot-status"></span>${inServiceCount}</span>
            <span class="stat-status inactive"><span class="dot-status"></span>${inactiveCount}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}


// ===================================================================
// 10. FLEET CHARTS (Fuel Combo + Cost)
// ===================================================================
async function loadFleetFuelChart_() {
  try {
    const fuel = cache.FuelLogs || [];

    const years = getAvailableYears_(fuel, []);
    const yearSelect = document.getElementById("fleetFuelYear");
    const defaultYear = years[0];
    yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

    const typeSelect = document.getElementById("fleetFuelType");
    const monthSelect = document.getElementById("fleetFuelMonth");
    
    if (!monthSelect.dataset.populated) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthSelect.innerHTML = `<option value="All" selected>All Months</option>` +
        monthNames.map((m, i) => `<option value="${i}">${m}</option>`).join("");
      monthSelect.dataset.populated = "true";
    }

    const rerender = () => renderFleetFuelCombo_(Number(yearSelect.value), typeSelect.value, monthSelect.value);
    yearSelect?.addEventListener("change", rerender);
    typeSelect?.addEventListener("change", rerender);
    monthSelect?.addEventListener("change", rerender);

    renderFleetFuelCombo_(defaultYear, "All", "All");
  } catch (err) {
    document.getElementById("fleetFuelComboChart").innerHTML = `<p class="hint">Couldn't load fuel chart (${err.message})</p>`;
  }
}

function renderFleetFuelCombo_(year, fuelType, monthVal) {
  const fuel = cache.FuelLogs || [];
  const isAllMonths = (!monthVal || monthVal === "All");
  const monthIdx = isAllMonths ? -1 : Number(monthVal);

  let dataLength = 12;
  let labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!isAllMonths) {
    dataLength = new Date(year, monthIdx + 1, 0).getDate();
    labels = Array.from({ length: dataLength }, (_, i) => String(i + 1));
  }

  const costTotals = new Array(dataLength).fill(0);
  const dieselQty = new Array(dataLength).fill(0);
  const petrolQty = new Array(dataLength).fill(0);

  fuel.forEach((r) => {
    if (!r.Date) return;
    const dt = new Date(r.Date);
    if (dt.getFullYear() !== year) return;
    
    let idx = -1;
    if (isAllMonths) {
      idx = dt.getMonth();
    } else {
      if (dt.getMonth() !== monthIdx) return;
      idx = dt.getDate() - 1;
    }

    costTotals[idx] += Number(r.Cost) || 0;
    if (r.Fueltype === "Diesel") dieselQty[idx] += Number(r.Liters) || 0;
    else if (r.Fueltype === "Petrol") petrolQty[idx] += Number(r.Liters) || 0;
  });

  const container = document.getElementById("fleetFuelComboChart");

  if (fuelType === "All") {
    container.innerHTML = comboChartSvg_(dieselQty, costTotals, labels, "fleetFuelComboSvg", petrolQty, 180);
    attachComboHover_("fleetFuelComboSvg", dieselQty, costTotals, petrolQty, 180);

    // ✅ Legend Click Events
    document.querySelectorAll('.interactive-legend .legend-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.cat;
        fuelComboVisibility_[cat] = !fuelComboVisibility_[cat];

        // අඩුම තරමින් එකක් හරි පේන්න තියෙන්න ඕන
        if (!fuelComboVisibility_.diesel && !fuelComboVisibility_.petrol && !fuelComboVisibility_.cost) {
           fuelComboVisibility_[cat] = true;
        }
        
        renderFleetFuelCombo_(year, fuelType, monthVal);
      });
    });
  } else {
    const qtyTotals = (fuelType === "Diesel") ? dieselQty : petrolQty;
    container.innerHTML = comboChartSvg_(qtyTotals, costTotals, labels, "fleetFuelComboSvg", undefined, 180);
    attachComboHover_("fleetFuelComboSvg", qtyTotals, costTotals, undefined, 180);
  }
}

async function loadFleetTotalCostChart_() {
  try {
    // ✅ API call කරන්නේ නැතුව, Cache එකෙන් දත්ත ගන්නවා
    const fuel = cache.FuelLogs || [];
    const lubricant = cache.Lubricant || [];
    const service = cache.Maintenance || [];
    const repair = cache.Repair || [];
    const license = cache.License || [];
    const insurance = cache.Insurance || [];
    const vehicles = cache.Vehicles || [];

    fleetCostData_ = { fuel, lubricant, service, repair, license, insurance, vehicles };

    const years = getAvailableYears_(
      [...fuel, ...lubricant, ...service, ...repair],
      [...license, ...insurance]
    );
    
    const yearSelect = document.getElementById("fleetCostChartYear");
    const defaultYear = years[0];
    yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

    yearSelect?.addEventListener("change", (e) => {
      const y = Number(e.target.value);
      renderFleetTotalCostChart_(y);
      setupTopVehiclesMonthFilter_(y);
    });
    
    const typeSelect = document.getElementById("fleetCostChartType");
    typeSelect?.addEventListener("change", () => {
      renderFleetTotalCostChart_(Number(yearSelect.value));
    });

    const monthSelect = document.getElementById("fleetCostChartMonth");
    if (!monthSelect.dataset.populated) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthSelect.innerHTML = `<option value="All" selected>All Months</option>` +
        monthNames.map((m, i) => `<option value="${i}">${m}</option>`).join("");
      monthSelect.dataset.populated = "true";
      
      monthSelect?.addEventListener("change", () => {
        renderFleetTotalCostChart_(Number(yearSelect.value));
      });
    }
    
    renderFleetTotalCostChart_(defaultYear);
    setupTopVehiclesMonthFilter_(defaultYear);
    
  } catch (err) {
    document.getElementById("fleetCostChartContainer").innerHTML = `<p class="hint">Couldn't load chart (${err.message})</p>`;
  }
}

function renderFleetTotalCostChart_(year) {
  const d = fleetCostData_;
  if (!d) return;
  
  const chartType = document.getElementById("fleetCostChartType").value;
  const monthVal = document.getElementById("fleetCostChartMonth").value;
  const isAllMonths = (monthVal === "All");

  const formatMn = (v) => {
    if (v >= 1_000_000) return "Rs. " + (v / 1_000_000).toFixed(2) + " Mn";
    if (v >= 1_000) return "Rs. " + Math.round(v / 1000) + "K";
    return "Rs. " + Math.round(v);
  };

  if (chartType === "grand") {
    if (isAllMonths) {
      const monthTotals = new Array(12).fill(0);
      const addByDate = (rows, dateKey) => {
        rows.forEach((r) => {
          if (!r[dateKey]) return;
          const dt = new Date(r[dateKey]);
          if (dt.getFullYear() === year) monthTotals[dt.getMonth()] += Number(r.Cost) || 0;
        });
      };
      addByDate(d.fuel, "Date");
      addByDate(d.lubricant, "Date");
      addByDate(d.service, "Date");
      addByDate(d.repair, "Date");
      addByDate(d.license, "FromDate");
      addByDate(d.insurance, "FromDate");

      document.getElementById("fleetCostChartContainer").innerHTML =
        lineChartSvg_(monthTotals, "#3B82F6", "fleetCostSvg", true, 10.5, undefined, 240, 950, formatMn);
    } else {
      const monthIdx = Number(monthVal);
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const dailyTotals = new Array(daysInMonth).fill(0);
      const addByDate = (rows, dateKey) => {
        rows.forEach((r) => {
          if (!r[dateKey]) return;
          const dt = new Date(r[dateKey]);
          if (dt.getFullYear() === year && dt.getMonth() === monthIdx) {
            dailyTotals[dt.getDate() - 1] += Number(r.Cost) || 0;
          }
        });
      };
      addByDate(d.fuel, "Date");
      addByDate(d.lubricant, "Date");
      addByDate(d.service, "Date");
      addByDate(d.repair, "Date");
      addByDate(d.license, "FromDate");
      addByDate(d.insurance, "FromDate");

      const dayLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

      document.getElementById("fleetCostChartContainer").innerHTML =
        lineChartSvg_(dailyTotals, "#3B82F6", "fleetCostSvg", true, 9, undefined, 240, 950, formatMn, dayLabels);
    }
    return;
  }

  if (chartType === "category") {
    if (isAllMonths) {
      const fuelArr = new Array(12).fill(0);
      const lubeArr = new Array(12).fill(0);
      const servArr = new Array(12).fill(0);
      const repArr = new Array(12).fill(0);

      const addByDate = (rows, dateKey, arr) => {
        rows.forEach((r) => {
          if (!r[dateKey]) return;
          const dt = new Date(r[dateKey]);
          if (dt.getFullYear() === year) arr[dt.getMonth()] += Number(r.Cost) || 0;
        });
      };

      addByDate(d.fuel, "Date", fuelArr);
      addByDate(d.lubricant, "Date", lubeArr);
      addByDate(d.service, "Date", servArr);
      addByDate(d.repair, "Date", repArr);

      document.getElementById("fleetCostChartContainer").innerHTML = 
        stackedColumnChartSvg_(fuelArr, lubeArr, servArr, repArr);

        attachStackedBarHover_();
        
      // ✅ Legend Click Events
      document.querySelectorAll('.interactive-legend .legend-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const cat = e.currentTarget.dataset.cat;
          chartCategoryVisibility_[cat] = !chartCategoryVisibility_[cat];
          
          // අඩුම තරමින් එකක් හරි පේන්න තියෙන්න ඕන නම් (Optional)
          if (!chartCategoryVisibility_.fuel && !chartCategoryVisibility_.lube && !chartCategoryVisibility_.service && !chartCategoryVisibility_.repair) {
             chartCategoryVisibility_[cat] = true; // හැම එකක්ම අයින් කරොත් අන්තිම එක ආපහු තියන්න
          }
          
          renderFleetTotalCostChart_(year);
        });
      });
    } else {
      const monthIdx = Number(monthVal);
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const fuelArr = new Array(daysInMonth).fill(0);
      const lubeArr = new Array(daysInMonth).fill(0);
      const servArr = new Array(daysInMonth).fill(0);
      const repArr = new Array(daysInMonth).fill(0);

      const addByDate = (rows, dateKey, arr) => {
        rows.forEach((r) => {
          if (!r[dateKey]) return;
          const dt = new Date(r[dateKey]);
          if (dt.getFullYear() === year && dt.getMonth() === monthIdx) {
            arr[dt.getDate() - 1] += Number(r.Cost) || 0;
          }
        });
      };

      addByDate(d.fuel, "Date", fuelArr);
      addByDate(d.lubricant, "Date", lubeArr);
      addByDate(d.service, "Date", servArr);
      addByDate(d.repair, "Date", repArr);

      const dayLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

      document.getElementById("fleetCostChartContainer").innerHTML = 
        stackedColumnChartSvg_(fuelArr, lubeArr, servArr, repArr, dayLabels);
    }
  }
}

function stackedColumnChartSvg_(fuel, lube, service, repair, customLabels) {
  const months = customLabels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = 950, h = 240;
  const padL = 50, padR = 50, padT = 20, padB = 50; 
  
  const v = chartCategoryVisibility_;

  // Visible categories අනුව maxVal එක ගණනය කරන්න
  const totals = fuel.map((_, i) => {
    let t = 0;
    if (v.fuel) t += fuel[i];
    if (v.lube) t += lube[i];
    if (v.service) t += service[i];
    if (v.repair) t += repair[i];
    return t;
  });
  const maxVal = Math.max(...totals, 1);

  const stepX = (w - padL - padR) / months.length;
  const barWidth = Math.min(stepX * 0.45, 40);

  let bars = "";
  const gap = 2; 

  for (let i = 0; i < months.length; i++) {
    const xPos = padL + (stepX * i) + (stepX / 2);
    const x = xPos - barWidth / 2;
    let currentY = h - padB;

    const hFuel = v.fuel ? (fuel[i] / maxVal) * (h - padT - padB) : 0;
    const hLube = v.lube ? (lube[i] / maxVal) * (h - padT - padB) : 0;
    const hServ = v.service ? (service[i] / maxVal) * (h - padT - padB) : 0;
    const hRep = v.repair ? (repair[i] / maxVal) * (h - padT - padB) : 0;

        // Draw Fuel
    if (hFuel > 0) {
      const hasTop = (hLube > 0 || hServ > 0 || hRep > 0);
      const drawH = hFuel - (hasTop ? gap : 0);
      const drawY = currentY - hFuel + (hasTop ? gap : 0);
      bars += `<rect class="stacked-bar-segment" data-label="Fuel" data-value="${formatNumber_(fuel[i])}" data-color="#3B82F6" x="${x}" y="${drawY}" width="${barWidth}" height="${Math.max(0, drawH)}" fill="#3B82F6"></rect>`;
      currentY -= hFuel;
    }
    // Draw Lubricant
    if (hLube > 0) {
      const hasTop = (hServ > 0 || hRep > 0);
      const drawH = hLube - (hasTop ? gap : 0);
      const drawY = currentY - hLube + (hasTop ? gap : 0);
      bars += `<rect class="stacked-bar-segment" data-label="Lubricant" data-value="${formatNumber_(lube[i])}" data-color="#8B5CF6" x="${x}" y="${drawY}" width="${barWidth}" height="${Math.max(0, drawH)}" fill="#8B5CF6"></rect>`;
      currentY -= hLube;
    }
    // Draw Service
    if (hServ > 0) {
      const hasTop = (hRep > 0);
      const drawH = hServ - (hasTop ? gap : 0);
      const drawY = currentY - hServ + (hasTop ? gap : 0);
      bars += `<rect class="stacked-bar-segment" data-label="Service" data-value="${formatNumber_(service[i])}" data-color="#F59E0B" x="${x}" y="${drawY}" width="${barWidth}" height="${Math.max(0, drawH)}" fill="#F59E0B"></rect>`;
      currentY -= hServ;
    }
    // Draw Repair
    if (hRep > 0) {
      bars += `<rect class="stacked-bar-segment" data-label="Repair" data-value="${formatNumber_(repair[i])}" data-color="#EF4444" x="${x}" y="${currentY - hRep}" width="${barWidth}" height="${hRep}" fill="#EF4444"></rect>`;
      currentY -= hRep;
    }
  }

  let axes = "";
  for (let i = 0; i < months.length; i++) {
    if (months.length > 15 && i % 5 !== 0 && i !== months.length - 1) continue;
    const xPos = padL + (stepX * i) + (stepX / 2);
    axes += `<text x="${xPos}" y="${h - 10}" text-anchor="middle" class="line-chart-axis-label">${months[i]}</text>`;
  }

  // ✅ අලුත් Clickable Legend එක
  const legendHtml = `
    <div class="combo-legend interactive-legend" style="justify-content: center; margin-top: 10px;">
      <span class="legend-item ${v.fuel ? '' : 'inactive'}" data-cat="fuel"><span class="swatch" style="background:#3B82F6"></span>Fuel</span>
      <span class="legend-item ${v.lube ? '' : 'inactive'}" data-cat="lube"><span class="swatch" style="background:#8B5CF6"></span>Lubricant</span>
      <span class="legend-item ${v.service ? '' : 'inactive'}" data-cat="service"><span class="swatch" style="background:#F59E0B"></span>Service</span>
      <span class="legend-item ${v.repair ? '' : 'inactive'}" data-cat="repair"><span class="swatch" style="background:#EF4444"></span>Repair</span>
    </div>
  `;

  return `
    <svg class="line-chart-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      ${generateYAxisTicks_(maxVal, h, padT, padB, w, padL, padR).map(t => t.gridLine).join("")}
      <line class="chart-axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB + 15}" />
      <line class="chart-axis-line" x1="${padL}" y1="${h - padB + 15}" x2="${w - padR}" y2="${h - padB + 15}" />
      ${generateYAxisTicks_(maxVal, h, padT, padB, w, padL, padR).map(t => t.textLabel).join("")}
      ${bars}
      ${axes}
    </svg>
    ${legendHtml}
  `;
}

// ===================================================================
// STACKED BAR HOVER TOOLTIP
// ===================================================================
function attachStackedBarHover_() {
  let tooltip = document.getElementById('bar-hover-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'bar-hover-tooltip';
    tooltip.className = 'bar-hover-tooltip';
    document.body.appendChild(tooltip);
  }

  document.querySelectorAll('.stacked-bar-segment').forEach(seg => {
    seg.addEventListener('mouseenter', (e) => {
      tooltip.innerHTML = `
        <div class="tip-title" style="color:${seg.dataset.color}">${seg.dataset.label}</div>
        <div class="tip-value">${seg.dataset.value}</div>
      `;
      tooltip.style.opacity = '1';
    });

    seg.addEventListener('mousemove', (e) => {
      // Tooltip එක mouse එකට ටිකක් උඩින් සහ දකුණින් පෙන්නන්න
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY - 40) + 'px';
    });

    seg.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

function setupTopVehiclesMonthFilter_(year) {
  const monthSelect = document.getElementById("topVehiclesMonth");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const availableMonths = new Set();
  const d = fleetCostData_;
  if (d) {
    const checkRows = (rows, dateKey) => {
      rows.forEach((r) => {
        if (!r[dateKey]) return;
        const dt = new Date(r[dateKey]);
        if (dt.getFullYear() === year) availableMonths.add(dt.getMonth());
      });
    };
    checkRows(d.fuel, "Date");
    checkRows(d.lubricant, "Date");
    checkRows(d.service, "Date");
    checkRows(d.repair, "Date");
    checkRows(d.license, "FromDate");
    checkRows(d.insurance, "FromDate");
  }

  const sortedMonths = Array.from(availableMonths).sort((a, b) => a - b);
  monthSelect.innerHTML = sortedMonths.length
    ? sortedMonths.map((m) => `<option value="${m}">${monthNames[m]}</option>`).join("")
    : `<option value="">No data</option>`;

  monthSelect.onchange = () => renderTopVehiclesList_(year, Number(monthSelect.value));
  if (sortedMonths.length) renderTopVehiclesList_(year, sortedMonths[0]);
  else document.getElementById("topVehiclesList").innerHTML = `<p class="hint">No records for this year.</p>`;
}

function renderTopVehiclesList_(year, month) {
  const d = fleetCostData_;
  const container = document.getElementById("topVehiclesList");
  if (!d) return;

  const vehicleData = {}; 

  const addCost = (rows, dateKey, catKey) => {
    rows.forEach((r) => {
      if (!r[dateKey] || !r.VehicleID) return;
      const dt = new Date(r[dateKey]);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        const c = Number(r.Cost) || 0;
        if (!vehicleData[r.VehicleID]) {
          vehicleData[r.VehicleID] = { fuel: 0, lube: 0, service: 0, repair: 0, total: 0 };
        }
        vehicleData[r.VehicleID][catKey] += c;
        vehicleData[r.VehicleID].total += c;
      }
    });
  };

  addCost(d.fuel, "Date", "fuel");
  addCost(d.lubricant, "Date", "lube");
  addCost(d.service, "Date", "service");
  addCost(d.repair, "Date", "repair");

  const top10 = Object.entries(vehicleData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  if (!top10.length) {
    container.innerHTML = `<p class="hint">No cost records for this month.</p>`;
    return;
  }

  const maxCost = Math.max(...top10.map(([, data]) => data.total), 1);

  container.innerHTML = top10
    .map(([vNo, data], i) => {
      const vehicleInfo = d.vehicles.find((v) => v["Vehicle No"] === vNo);
      const department = vehicleInfo ? vehicleInfo.Department || "—" : "—";
      const pct = (data.total / maxCost) * 100; 

      const total = data.total || 1;
      const fuelPct = (data.fuel / total) * 100;
      const lubePct = (data.lube / total) * 100;
      const servPct = (data.service / total) * 100;
      const repPct = (data.repair / total) * 100;

      const segments = `
        <span class="bar-seg seg-fuel" style="width:${fuelPct}%" title="Fuel: ${formatNumber_(data.fuel)}"></span>
        <span class="bar-seg seg-lube" style="width:${lubePct}%" title="Lubricant: ${formatNumber_(data.lube)}"></span>
        <span class="bar-seg seg-service" style="width:${servPct}%" title="Service: ${formatNumber_(data.service)}"></span>
        <span class="bar-seg seg-repair" style="width:${repPct}%" title="Repair: ${formatNumber_(data.repair)}"></span>
      `;

      return `<div class="top-vehicle-row">
        <span class="top-vehicle-rank">${i + 1}</span>
        <span class="top-vehicle-name" title="${vNo}">${vNo}</span>
        <span class="top-vehicle-bar-wrap">
          <span class="top-vehicle-bar-stack" style="width:${pct}%;">
            ${segments}
          </span>
        </span>
        <span class="top-vehicle-dept" title="${department}">${department}</span>
        <span class="top-vehicle-cost">${formatNumber_(data.total)}</span>
      </div>`;
    })
    .join("");
}


// ===================================================================
// 11. VEHICLE LOOKUP
// ===================================================================
async function initVehicleLookup_() {
  try {
    const vehicles = cache.Vehicles || (await Api.list("Vehicles"));
    cache.Vehicles = vehicles;
    setupVehicleCombobox_(vehicles);

    if (vehicles.length > 0) {
      const firstVehicleNo = vehicles[0]["Vehicle No"];
      const input = document.getElementById("vehicleLookupInput");
      if (input) input.value = firstVehicleNo;
      loadVehicleLookup_(firstVehicleNo);
    }
  } catch (err) {
    /* Dashboard already shows errors */
  }
}

function setupVehicleCombobox_(vehicles) {
  const input = document.getElementById("vehicleLookupInput");
  const dropdown = document.getElementById("vehicleLookupDropdown");
  if (!input || !dropdown) return;

  const vehicleNumbers = vehicles.map((v) => v["Vehicle No"]).filter(Boolean);

  const renderList_ = (filterText) => {
    const filtered = filterText
      ? vehicleNumbers.filter((no) => no.toLowerCase().includes(filterText.toLowerCase()))
      : vehicleNumbers;

    dropdown.innerHTML = filtered.length
      ? filtered.map((no) => `<div class="combobox-item" data-value="${no}">${no}</div>`).join("")
      : `<div class="combobox-empty">No matching vehicles</div>`;

    dropdown.querySelectorAll(".combobox-item").forEach((item) => {
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const vNo = item.dataset.value;
        input.value = vNo;
        dropdown.classList.remove("open");
        loadVehicleLookup_(vNo);
      });
    });
  };

  input.addEventListener("focus", () => { renderList_(""); dropdown.classList.add("open"); });
  input.addEventListener("click", () => { renderList_(input.value); dropdown.classList.add("open"); });
  input.addEventListener("input", () => { renderList_(input.value); dropdown.classList.add("open"); });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const match =
        vehicleNumbers.find((no) => no.toLowerCase() === input.value.toLowerCase()) ||
        vehicleNumbers.find((no) => no.toLowerCase().includes(input.value.toLowerCase()));
      if (match) {
        input.value = match;
        dropdown.classList.remove("open");
        loadVehicleLookup_(match);
      }
    }
  });
}

const vehicleLookupInput = document.getElementById("vehicleLookupInput");
if (vehicleLookupInput) {
  vehicleLookupInput.addEventListener("change", (e) => {
    const vNo = e.target.value.trim();
    if (vNo) loadVehicleLookup_(vNo);
  });
}

async function loadVehicleLookup_(vehicleNo) {
  const resultsEl = document.getElementById("vehicleLookupResults");
  resultsEl.innerHTML = `<p class="hint">Loading ${vehicleNo}…</p>`;
  updateVehicleImage_(vehicleNo);

  try {
    const [vehicles, drivers, fuel, lubricant, service, repair, license, insurance, accidents] =
      await Promise.all([
        cache.Vehicles || Api.list("Vehicles"),
        Api.list("Drivers"),
        Api.list("FuelLogs"),
        Api.list("Lubricant"),
        Api.list("Maintenance"),
        Api.list("Repair"),
        Api.list("License"),
        Api.list("Insurance"),
        Api.list("Accident"),
      ]);

    const vehicle = vehicles.find((v) => String(v["Vehicle No"]) === vehicleNo);
    if (!vehicle) {
      resultsEl.innerHTML = `<p class="hint">No vehicle found with that number.</p>`;
      return;
    }

    const matches = (rows) => rows.filter((r) => String(r.VehicleID) === vehicleNo);
    const driverMatch = drivers.find((d) => String(d.AssignedVehicle) === vehicleNo);
    const fuelRows = matches(fuel);
    const lubeRows = matches(lubricant);
    const serviceRows = matches(service);
    const repairRows = matches(repair);
    const licenseRows = matches(license);
    const insuranceRows = matches(insurance);
    const licenseRow = licenseRows.slice(-1)[0];
    const insuranceRow = insuranceRows.slice(-1)[0];
    const accidentRows = matches(accidents);

    currentVehicleLookup_ = { fuelRows, lubeRows, serviceRows, repairRows, licenseRows, insuranceRows, vehicleNo };

    const years = getAvailableYears_(
      [...fuelRows, ...lubeRows, ...serviceRows, ...repairRows],
      [...licenseRows, ...insuranceRows]
    );
    const defaultYear = years[0];

    resultsEl.innerHTML = `
      <div class="lookup-grid">
        ${infoCard_("Vehicle Informations", [
          ["Type", vehicle.Type], ["Model", vehicle.Model], ["Year", vehicle.Year],
          ["Status", vehicle.Status], ["Department", vehicle.Department], ["User", vehicle.User],
        ])}
        ${infoCard_("Driver Informations", driverMatch ? [
          ["Name", driverMatch.Name], ["NIC No", driverMatch.NICNO], ["License No", driverMatch.License],
          ["License Expiry Date", driverMatch.LicenseExpiryDate], ["Phone", driverMatch.Phone], ["Address", driverMatch.Address],
        ] : [["Assigned driver", "Not assigned"]])}
        ${infoCard_("License", licenseRow ? [
          ["License No", licenseRow.LicenseNo], ["From Date", licenseRow.FromDate], ["To Date", licenseRow.ToDate],
          ["Days to Expiry", licenseRow.LicenseExpiry], ["Cost (Rs.)", licenseRow.Cost],
        ] : [["License", "No record"]])}
        ${infoCard_("Insurance", insuranceRow ? [
          ["Company", insuranceRow.InsuranceCompany], ["Policy No", insuranceRow.PolicyNo], ["From Date", insuranceRow.FromDate],
          ["To Date", insuranceRow.ToDate], ["Days to Expiry", insuranceRow.InsuranceExpiry], ["Cost (Rs.)", insuranceRow.Cost],
        ] : [["Insurance", "No record"]])}
      </div>

      <div class="vehicle-charts-row">
        <div class="panel">
          <div class="chart-toolbar">
            <h2 style="font-size:14px;">Monthly Total Cost Trend</h2>
            <select id="costChartYear">
              ${years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("")}
            </select>
          </div>
          <div class="panel-body" id="costChartContainer"></div>
        </div>

        <div class="panel">
          <div class="chart-toolbar">
            <h2 style="font-size:14px;">Fuel History (${fuelRows.length})</h2>
            <div style="display:flex; gap:8px;">
              <select id="vehicleFuelYear"></select>
              <select id="vehicleFuelMonth"></select>
            </div>
          </div>
          <div class="panel-body" id="vehicleFuelComboChart">Loading…</div>
        </div>
      </div>

      <div class="lookup-triple-row">
        <div class="panel">
          <div class="panel-head"><h2>Lubricant (${lubeRows.length})</h2></div>
          <div class="panel-body table-scroll">${miniTable_(lubeRows, ["Date", "Category", "Model", "Quantity", "Cost"])}</div>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Service (${serviceRows.length})</h2></div>
          <div class="panel-body table-scroll">${miniTable_(serviceRows, ["Date", "ServiceType", "Cost", "NextDueDate"])}</div>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Repair (${repairRows.length})</h2></div>
          <div class="panel-body table-scroll">${miniTable_(repairRows, ["Date", "RepairArea", "Repair", "Cost"])}</div>
        </div>
      </div>

      <div class="lookup-triple-row">
        <div class="panel">
          <div class="chart-toolbar">
            <h2 style="font-size:13.5px;">Lubricant Monthly Cost</h2>
            <div style="display:flex; align-items:center;">
              <select id="lubeCostYear"></select>
              <div class="chart-zoom-controls">
                <button type="button" class="chart-zoom-btn" data-zoom-target="lubeCostChart" data-zoom-dir="out">−</button>
                <button type="button" class="chart-zoom-btn" data-zoom-target="lubeCostChart" data-zoom-dir="in">+</button>
              </div>
            </div>
          </div>
          <div class="panel-body chart-zoom-wrap"><div class="chart-zoom-inner" id="lubeCostChart"></div></div>
        </div>
        <div class="panel">
          <div class="chart-toolbar">
            <h2 style="font-size:13.5px;">Service Monthly Cost</h2>
            <div style="display:flex; align-items:center;">
              <select id="serviceCostYear"></select>
              <div class="chart-zoom-controls">
                <button type="button" class="chart-zoom-btn" data-zoom-target="serviceCostChart" data-zoom-dir="out">−</button>
                <button type="button" class="chart-zoom-btn" data-zoom-target="serviceCostChart" data-zoom-dir="in">+</button>
              </div>
            </div>
          </div>
          <div class="panel-body chart-zoom-wrap"><div class="chart-zoom-inner" id="serviceCostChart"></div></div>
        </div>
        <div class="panel">
          <div class="chart-toolbar">
            <h2 style="font-size:13.5px;">Repair Monthly Cost</h2>
            <div style="display:flex; align-items:center;">
              <select id="repairCostYear"></select>
              <div class="chart-zoom-controls">
                <button type="button" class="chart-zoom-btn" data-zoom-target="repairCostChart" data-zoom-dir="out">−</button>
                <button type="button" class="chart-zoom-btn" data-zoom-target="repairCostChart" data-zoom-dir="in">+</button>
              </div>
            </div>
          </div>
          <div class="panel-body chart-zoom-wrap"><div class="chart-zoom-inner" id="repairCostChart"></div></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h2>Accident History (${accidentRows.length})</h2></div>
        <div class="panel-body table-scroll">${miniTable_(accidentRows, ["AccidentDate", "AccidentType", "Severity", "DamageCost", "Status "])}</div>
      </div>
    `;

    renderMonthlyCostChart_(defaultYear);
    document.getElementById("costChartYear")?.addEventListener("change", (e) => {
      renderMonthlyCostChart_(Number(e.target.value));
    });

    setupVehicleFuelFilters_(fuelRows);
    setupTripleCostCharts_(lubeRows, serviceRows, repairRows, years);
  } catch (err) {
    resultsEl.innerHTML = `<p class="hint">Couldn't load vehicle history (${err.message})</p>`;
  }
}

function infoCard_(title, rows) {
  return `<div class="info-card">
    <h3>${title}</h3>
    ${rows.map(([k, v]) => {
        const isCost = /cost/i.test(k);
        const display = isCost && v !== undefined && v !== "" ? formatNumber_(v) : v ?? "—";
        return `<div class="info-row"><span>${k}</span><span>${display}</span></div>`;
      }).join("")}
  </div>`;
}

function miniTable_(rows, columns) {
  if (!rows.length) return `<p class="hint">No records.</p>`;
  return `<table><thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${columns.map((c) => {
            const isCost = /cost/i.test(c);
            const val = r[c];
            const display = isCost && val !== undefined && val !== "" ? formatNumber_(val) : val ?? "";
            return `<td>${display}</td>`;
          }).join("")}</tr>`).join("")}</tbody></table>`;
}


// ===================================================================
// 12. CHART HELPERS
// ===================================================================
function getAvailableYears_(datedRows, fromDatedRows) {
  const years = new Set([new Date().getFullYear()]);
  datedRows.forEach((r) => { if (r.Date) years.add(new Date(r.Date).getFullYear()); });
  fromDatedRows.forEach((r) => { if (r.FromDate) years.add(new Date(r.FromDate).getFullYear()); });
  return Array.from(years).sort((a, b) => b - a);
}

function renderMonthlyCostChart_(year) {
  const d = currentVehicleLookup_;
  if (!d) return;
  const monthTotals = new Array(12).fill(0);

  const addByDate = (rows, dateKey) => {
    rows.forEach((r) => {
      if (!r[dateKey]) return;
      const dt = new Date(r[dateKey]);
      if (dt.getFullYear() === year) monthTotals[dt.getMonth()] += Number(r.Cost) || 0;
    });
  };
  addByDate(d.fuelRows, "Date");
  addByDate(d.lubeRows, "Date");
  addByDate(d.serviceRows, "Date");
  addByDate(d.repairRows, "Date");
  addByDate(d.licenseRows, "FromDate");
  addByDate(d.insuranceRows, "FromDate");

  document.getElementById("costChartContainer").innerHTML =
    lineChartSvg_(monthTotals, "#3B82F6", undefined, true, undefined, undefined, 220);
}

function formatAxisValue_(v) {
  if (v === 0) return "0";
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(0) + "K";
  return Math.round(v).toString();
}

function generateYAxisTicks_(maxVal, h, padT, padB, w, padL, padR) {
  const ticks = [];
  const steps = 4; 
  for (let i = 0; i <= steps; i++) {
    const val = (maxVal / steps) * i;
    const y = padT + (h - padT - padB) * (1 - i / steps);
    const label = formatAxisValue_(val);
    
    const gridLine = `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#eef1f7" stroke-width="1" stroke-dasharray="4,4" />`;
    const textLabel = `<text x="${padL - 8}" y="${y + 3}" text-anchor="end" class="line-chart-axis-label y-axis-label">${label}</text>`;
    
    ticks.push({ gridLine, textLabel });
  }
  return ticks;
}

function lineChartSvg_(values, color, svgId, showLabelBg, labelFontSize, counts, customH, customW, formatLabel, customLabels) {
  const fontSize = labelFontSize || 9.5;
  const monthLabels = customLabels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = customW || 640, h = customH || 100, padL = 50, padR = 50, padT = 16, padB = 28;
  const gradId = (svgId || "lineChart") + "-gradient";
  const chartColor = color || "var(--steel)";
  const max = Math.max(...values, 1) * 1.15;
  const stepX = (w - padL - padR) / values.length;
  const yFor = (v) => padT + (h - padT - padB) * (1 - v / max);
  const xFor = (i) => padL + (stepX * i) + (stepX / 2);

  const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
  const areaPoints = `${padL},${yFor(0)} ${points} ${w - padR},${yFor(0)}`;

  const yAxisTicks = generateYAxisTicks_(max, h, padT, padB, w, padL, padR);
  const yGridLines = yAxisTicks.map(t => t.gridLine).join("");
  const yLabels = yAxisTicks.map(t => t.textLabel).join("");

  const dots = values.map((v, i) => {
      const countText = counts ? ` (${counts[i]} record${counts[i] === 1 ? "" : "s"})` : "";
      const labelText = formatLabel ? formatLabel(v) : `Rs.${Math.round(v).toLocaleString("en-US")}`;
      return `<circle class="line-chart-dot" cx="${xFor(i)}" cy="${yFor(v)}" r="3.5">
          <title>${monthLabels[i]}: ${formatNumber_(v)}${countText}</title>
        </circle>
        ${v > 0 ? `<text class="line-chart-value-label" x="${xFor(i)}" y="${yFor(v) - 8}" text-anchor="middle" style="font-size:${fontSize}px">${labelText}</text>` : ""}`;
    }).join("");

  const axisLabels = monthLabels.map((m, i) => `<text class="line-chart-axis-label" x="${xFor(i)}" y="${h - 18}" text-anchor="middle">${m}</text>`).join("");

  return `<svg class="line-chart-svg" style="--chart-line-color:${chartColor}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    ${yGridLines}
    <line class="chart-axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" />
    <line class="chart-axis-line" x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" />
    ${yLabels}
    
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   style="stop-color:${chartColor};stop-opacity:0.65"/>
        <stop offset="55%"  style="stop-color:${chartColor};stop-opacity:0.25"/>
        <stop offset="100%" style="stop-color:${chartColor};stop-opacity:0"/>
      </linearGradient>
    </defs>
    <polygon class="line-chart-area" style="fill:url(#${gradId})" points="${areaPoints}"></polygon>
    <polyline class="line-chart-path" points="${points}"></polyline>
    ${dots}
    ${axisLabels}
  </svg>`;
}

function comboChartGeometry_(qtyValues, costValues, qtyValues2, customH) {
  const w = 700, h = customH || 240, padL = 60, padR = 60, padT = 20, padB = 50;
  const allQty = qtyValues2 ? qtyValues.concat(qtyValues2) : qtyValues;
  const maxQty = Math.max(...allQty, 1) * 1.2;
  const maxCost = Math.max(...costValues, 1) * 1.2;
  const stepX = (w - padL - padR) / qtyValues.length;
  return {
    w, h, padT, padB, padL, padR,
    xFor: (i) => padL + stepX * i + (stepX / 2),
    yForQty: (v) => padT + (h - padT - padB) * (1 - v / maxQty),
    yForCost: (v) => padT + (h - padT - padB) * (1 - v / maxCost),
    barWidth: qtyValues2 ? stepX * 0.36 : stepX * 0.42,
  };
}

function smoothLinePath_(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function comboChartSvg_(qtyValues, costValues, customLabels, svgId, qtyValues2, customH) {
  const monthLabels = customLabels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const isFleet = (svgId === "fleetFuelComboSvg" && qtyValues2 !== undefined);
  const v = isFleet ? fuelComboVisibility_ : { diesel: true, petrol: true, cost: true };

  // Hide කරපු ඒවා 0 කරන්න
  const displayDiesel = v.diesel ? qtyValues : qtyValues.map(() => 0);
  const displayPetrol = v.petrol && qtyValues2 ? qtyValues2 : (qtyValues2 ? qtyValues2.map(() => 0) : undefined);

  const geo = comboChartGeometry_(displayDiesel, costValues, displayPetrol, customH);

  const bars = displayPetrol ? displayDiesel.map((val, i) => {
          const gap = geo.barWidth * 0.15;
          const x1 = geo.xFor(i) - geo.barWidth - gap / 2;
          const x2 = geo.xFor(i) + gap / 2;
          const v2 = displayPetrol[i];
          const y1 = geo.yForQty(val);
          const h1 = Math.max(geo.h - geo.padB - y1, 0);
          const y2 = geo.yForQty(v2);
          const h2 = Math.max(geo.h - geo.padB - y2, 0);
          return `
            <rect class="combo-bar combo-bar-a" x="${x1}" y="${y1}" width="${geo.barWidth}" height="${h1}" rx="3"></rect>
            ${val > 0 ? `<text class="combo-bar-label" x="${x1 + geo.barWidth / 2}" y="${y1 - 6}" text-anchor="middle">${Math.round(val)} Ltr</text>` : ""}
            <rect class="combo-bar combo-bar-b" x="${x2}" y="${y2}" width="${geo.barWidth}" height="${h2}" rx="3"></rect>
            ${v2 > 0 ? `<text class="combo-bar-label" x="${x2 + geo.barWidth / 2}" y="${y2 - 6}" text-anchor="middle">${Math.round(v2)} Ltr</text>` : ""}
          `;
        }).join("")
    : displayDiesel.map((val, i) => {
          const barY = geo.yForQty(val);
          const barH = Math.max(geo.h - geo.padB - barY, 0);
          return `<rect class="combo-bar" x="${geo.xFor(i) - geo.barWidth / 2}" y="${barY}" width="${geo.barWidth}" height="${barH}" rx="3"></rect>
            ${val > 0 ? `<text class="combo-bar-label" x="${geo.xFor(i)}" y="${barY - 6}" text-anchor="middle">${Math.round(val)} Ltr</text>` : ""}`;
        }).join("");

  const linePoints = costValues.map((val, i) => ({ x: geo.xFor(i), y: geo.yForCost(val) }));
  const linePath = v.cost ? smoothLinePath_(linePoints) : "";

  const axisLabels = monthLabels.map((m, i) => {
      if (monthLabels.length > 15 && i % 5 !== 0 && i !== monthLabels.length - 1) return "";
      return `<text class="combo-axis-label" x="${geo.xFor(i)}" y="${geo.h - 22}" text-anchor="middle">${m}</text>`;
    }).join("");

  const hoverElements = v.cost ? `
      <circle id="${svgId || "fleetFuelComboSvg"}-dot" class="combo-hover-dot" r="3"></circle>
      <rect id="${svgId || "fleetFuelComboSvg"}-label-bg" class="combo-hover-label-bg"></rect>
      <text id="${svgId || "fleetFuelComboSvg"}-label" class="combo-hover-label"></text>
  ` : "";

  // ✅ අලුත් Clickable Legend එක
  const legendHtml = `
    <div class="combo-legend interactive-legend" style="justify-content: center;">
      ${isFleet ? `
        <span class="legend-item ${v.diesel ? '' : 'inactive'}" data-cat="diesel"><span class="swatch" style="background:rgb(10, 10, 141)"></span>Diesel Qty</span>
        <span class="legend-item ${v.petrol ? '' : 'inactive'}" data-cat="petrol"><span class="swatch" style="background:rgb(74, 186, 247)"></span>Petrol Qty</span>
        <span class="legend-item ${v.cost ? '' : 'inactive'}" data-cat="cost"><span class="swatch" style="background:rgb(54, 119, 249)"></span>Total Cost</span>
      ` : `
        <span><span class="swatch" style="background:rgb(10, 10, 141)"></span>Quantity (Ltr)</span>
        <span><span class="swatch" style="background:rgb(54, 119, 249)"></span>Cost (Rs.)</span>
      `}
    </div>
  `;

  return `
    <svg class="combo-chart-svg" id="${svgId || 'fleetFuelComboSvg'}" viewBox="0 0 ${geo.w} ${geo.h}" xmlns="http://www.w3.org/2000/svg">
      ${generateYAxisTicks_(Math.max(...costValues, 1) * 1.2, geo.h, geo.padT, geo.padB, geo.w, geo.padL, geo.padR).map(t => t.gridLine).join("")}
      <line class="chart-axis-line" x1="${geo.padL}" y1="${geo.padT}" x2="${geo.padL}" y2="${geo.h - geo.padB + 15}" />
      <line class="chart-axis-line" x1="${geo.padL}" y1="${geo.h - geo.padB + 15}" x2="${geo.w - geo.padR}" y2="${geo.h - geo.padB + 15}" />
      ${generateYAxisTicks_(Math.max(...costValues, 1) * 1.2, geo.h, geo.padT, geo.padB, geo.w, geo.padL, geo.padR).map(t => t.textLabel).join("")}
      ${bars}
      ${v.cost ? `<path class="combo-line-path" d="${linePath}"></path>` : ""}
      ${axisLabels}
      ${hoverElements}
    </svg>
    ${legendHtml}
  `;
}

function attachComboHover_(svgId, qtyValues, costValues, qtyValues2, customH) {
  // Cost Line එක hide කරලා නම් hover අවශ්‍ය නැහැ
  if (svgId === "fleetFuelComboSvg" && !fuelComboVisibility_.cost) return;

  const svg = document.getElementById(svgId);
  const dot = document.getElementById(`${svgId}-dot`);
  const label = document.getElementById(`${svgId}-label`);
  const labelBg = document.getElementById(`${svgId}-label-bg`);
  if (!svg || !dot || !label || !labelBg) return;
  const geo = comboChartGeometry_(qtyValues, costValues, qtyValues2, customH);

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = geo.w / rect.width;
    const mouseXInSvg = (e.clientX - rect.left) * scaleX;
    let nearest = 0, minDist = Infinity;
    costValues.forEach((_, i) => {
      const dist = Math.abs(geo.xFor(i) - mouseXInSvg);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    const cx = geo.xFor(nearest);
    const cy = geo.yForCost(costValues[nearest]);
    const text = formatNumber_(costValues[nearest]);

    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.style.display = "block";

    label.textContent = text;
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.style.display = "block";

    const textWidth = label.getComputedTextLength();
    const paddingX = 8;
    const boxHeight = 16;
    const boxWidth = textWidth + paddingX * 2;
    const boxX = cx - boxWidth / 2;
    const boxY = cy - boxHeight - 6;

    label.setAttribute("x", cx);
    label.setAttribute("y", boxY + boxHeight / 2);

    labelBg.setAttribute("x", boxX);
    labelBg.setAttribute("y", boxY);
    labelBg.setAttribute("width", boxWidth);
    labelBg.setAttribute("height", boxHeight);
    labelBg.setAttribute("rx", 3);
    labelBg.style.display = "block";
  });
  svg.addEventListener("mouseleave", () => {
    dot.style.display = "none";
    label.style.display = "none";
    labelBg.style.display = "none";
  });
}

function setupVehicleFuelFilters_(fuelRows) {
  const years = getAvailableYears_(fuelRows, []);
  const yearSelect = document.getElementById("vehicleFuelYear");
  const monthSelect = document.getElementById("vehicleFuelMonth");
  const defaultYear = years[0];

  yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthSelect.innerHTML = `<option value="All" selected>All (Monthly view)</option>` +
    monthNames.map((m, i) => `<option value="${i}">${m}</option>`).join("");

  const rerender = () => renderVehicleFuelChart_(fuelRows, Number(yearSelect.value), monthSelect.value);
  yearSelect?.addEventListener("change", rerender);
  monthSelect?.addEventListener("change", rerender);

  renderVehicleFuelChart_(fuelRows, defaultYear, "All");
}

function renderVehicleFuelChart_(fuelRows, year, month) {
  const container = document.getElementById("vehicleFuelComboChart");

  if (month === "All") {
    const qtyTotals = new Array(12).fill(0);
    const costTotals = new Array(12).fill(0);
    fuelRows.forEach((r) => {
      if (!r.Date) return;
      const dt = new Date(r.Date);
      if (dt.getFullYear() !== year) return;
      qtyTotals[dt.getMonth()] += Number(r.Liters) || 0;
      costTotals[dt.getMonth()] += Number(r.Cost) || 0;
    });
    container.innerHTML = comboChartSvg_(qtyTotals, costTotals, undefined, "vehicleFuelComboSvg", undefined, 220);
    attachComboHover_("vehicleFuelComboSvg", qtyTotals, costTotals, undefined, 220);
    return;
  }

  const monthIndex = Number(month);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const qtyTotals = new Array(daysInMonth).fill(0);
  const costTotals = new Array(daysInMonth).fill(0);
  const dayLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  fuelRows.forEach((r) => {
    if (!r.Date) return;
    const dt = new Date(r.Date);
    if (dt.getFullYear() !== year || dt.getMonth() !== monthIndex) return;
    const dayIdx = dt.getDate() - 1;
    qtyTotals[dayIdx] += Number(r.Liters) || 0;
    costTotals[dayIdx] += Number(r.Cost) || 0;
  });

  container.innerHTML = comboChartSvg_(qtyTotals, costTotals, dayLabels, "vehicleFuelComboSvg", undefined, 220);
  attachComboHover_("vehicleFuelComboSvg", qtyTotals, costTotals, undefined, 220);
}

function setupTripleCostCharts_(lubeRows, serviceRows, repairRows, years) {
  const configs = [
    { rows: lubeRows, yearSelectId: "lubeCostYear", containerId: "lubeCostChart", svgId: "lubeCostSvg", color: "#2D6A6A" },
    { rows: serviceRows, yearSelectId: "serviceCostYear", containerId: "serviceCostChart", svgId: "serviceCostSvg", color: "#D98A3D" },
    { rows: repairRows, yearSelectId: "repairCostYear", containerId: "repairCostChart", svgId: "repairCostSvg", color: "#C0564A" },
  ];

  configs.forEach((cfg) => {
    const yearSelect = document.getElementById(cfg.yearSelectId);
    const defaultYear = years[0];
    yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

    const render = () => renderSingleCostLineChart_(cfg.rows, Number(yearSelect.value), cfg.color, cfg.containerId, cfg.svgId, 9.5);
    yearSelect?.addEventListener("change", render);
    render();
  });
}

function renderSingleCostLineChart_(rows, year, color, containerId, svgId, fontSize) {
  const monthTotals = new Array(12).fill(0);
  const monthCounts = new Array(12).fill(0);
  rows.forEach((r) => {
    if (!r.Date) return;
    const dt = new Date(r.Date);
    if (dt.getFullYear() === year) {
      monthTotals[dt.getMonth()] += Number(r.Cost) || 0;
      monthCounts[dt.getMonth()] += 1;
    }
  });
  document.getElementById(containerId).innerHTML = lineChartSvg_(monthTotals, color, svgId, undefined, fontSize, monthCounts);
}


// ===================================================================
// 13. EXPIRING PANELS
// ===================================================================
async function loadExpiringPanels_() {
  try {
    const vehicles = cache.Vehicles || [];
    const license = cache.License || [];
    const insurance = cache.Insurance || [];

    renderExpiringPanel_(license, vehicles, "licenseExpiringList");
    renderExpiringPanel_(insurance, vehicles, "insuranceExpiringList");
  } catch (err) {
    const msg = `<p class="hint">Couldn't load (${err.message})</p>`;
    document.getElementById("licenseExpiringList").innerHTML = msg;
    document.getElementById("insuranceExpiringList").innerHTML = msg;
  }
}

function renderExpiringPanel_(rows, vehicles, containerId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestByVehicle = {};
  rows.forEach((r) => {
    if (!r.ToDate) return;
    latestByVehicle[r.VehicleID] = r;
  });

  const withDaysLeft = Object.values(latestByVehicle)
    .map((r) => {
      const toDate = new Date(r.ToDate);
      const daysLeft = Math.round((toDate - today) / 86400000);
      return { ...r, daysLeft };
    })
    .filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const container = document.getElementById(containerId);
  if (!withDaysLeft.length) {
    container.innerHTML = `
      <div class="expiring-empty">
        <span style="font-size: 24px; margin-bottom: 8px;">🎉</span>
        <p>No vehicles expiring within 30 days.</p>
      </div>`;
    return;
  }

  const html = withDaysLeft.map((r) => {
      const v = vehicles.find((veh) => veh["Vehicle No"] === r.VehicleID) || {};
      
      // අවසන් වෙන දින ගණන අනුව පාට තීරණය කිරීම (දවස් 30ට)
      let badgeClass = "safe";
      let icon = "🟢";
      if (r.daysLeft <= 7) { badgeClass = "urgent"; icon = "🔴"; }       // සතියකට අඩු
      else if (r.daysLeft <= 14) { badgeClass = "warning"; icon = "🟡"; } // සති 2කට අඩු

      return `
      <div class="expiring-row">
        <div class="exp-left">
          <div class="exp-icon">🚗</div>
          <div>
            <div class="exp-vno">${r.VehicleID || "Unknown"}</div>
            <div class="exp-sub">${v.Department || "No Dept"} • ${v.User || "No User"}</div>
          </div>
        </div>
        <div class="exp-right">
          <div class="exp-date">${r.ToDate || ""}</div>
          <div class="exp-badge ${badgeClass}">${icon} ${r.daysLeft} Days</div>
        </div>
      </div>`;
    }).join("");

  container.innerHTML = `<div class="modern-expiring-list">${html}</div>`;
}


// ===================================================================
// 14. VEHICLE IMAGE
// ===================================================================
function updateVehicleImage_(vehicleNo) {
  const img = document.getElementById("vehicleLookupImage");
  if (!img) return;

  const safeName = vehicleNo.replace(/[^a-zA-Z0-9]/g, "");
  const tryImage = (ext) => { img.src = `images/vehicles/${safeName}.${ext}`; };

  img.onerror = function () {
    if (this.src.endsWith(".jpg")) {
      tryImage("png");
    } else {
      this.style.display = "none";
      const parent = this.parentElement;
      if (parent) {
        let placeholder = parent.querySelector(".vehicle-image-placeholder");
        if (!placeholder) {
          placeholder = document.createElement("span");
          placeholder.className = "vehicle-image-placeholder";
          placeholder.textContent = "🚗 No Image";
          placeholder.style.display = "block";
          placeholder.style.textAlign = "center";
          placeholder.style.padding = "20px";
          placeholder.style.fontSize = "14px";
          placeholder.style.color = "#999";
          parent.appendChild(placeholder);
        }
      }
    }
  };

  img.onload = function () {
    this.style.display = "block";
    const parent = this.parentElement;
    if (parent) {
      const placeholder = parent.querySelector(".vehicle-image-placeholder");
      if (placeholder) placeholder.remove();
    }
  };

  tryImage("jpg");
}


// ===================================================================
// 15. LIVE TRACKING
// ===================================================================
async function loadTracking() {
  if (!map) {
    map = L.map("map").setView([7.8731, 80.7718], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }

  const select = document.getElementById("trackVehicleSelect");
  try {
    const vehicles = cache.Vehicles || (await Api.list("Vehicles"));
    cache.Vehicles = vehicles;
    select.innerHTML = vehicles.map((v) => `<option value="${v["Vehicle No"]}">${v["Vehicle No"]} — ${v.Type || ""}</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option>Couldn't load vehicles</option>`;
  }

  try {
    const points = await Api.list("Tracking");
    markersLayer.clearLayers();
    const latest = {};
    points.forEach((p) => (latest[p.VehicleID] = p));

    const rows = Object.values(latest);
    rows.forEach((p) => {
      if (!p.Latitude || !p.Longitude) return;
      L.marker([Number(p.Latitude), Number(p.Longitude)])
        .addTo(markersLayer)
        .bindPopup(`<b>${p.VehicleID}</b><br>${p.Timestamp}`);
    });

    document.getElementById("trackList").innerHTML = rows.length
      ? rows.map((p) => `<p>🚚 <b>${p.VehicleID}</b> — last seen ${p.Timestamp}</p>`).join("")
      : "<p>No positions reported yet.</p>";
  } catch (err) {
    document.getElementById("trackList").innerHTML = `Couldn't load positions (${err.message})`;
  }
}

document.getElementById("pushLocationBtn")?.addEventListener("click", () => {
  const vehicleId = document.getElementById("trackVehicleSelect").value;
  const status = document.getElementById("pushStatus");
  if (!vehicleId) { status.textContent = "Select a vehicle first."; return; }
  if (!navigator.geolocation) { status.textContent = "Geolocation isn't supported."; return; }

  status.textContent = "Getting position…";
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await Api.add("Tracking", {
          VehicleID: vehicleId,
          Latitude: pos.coords.latitude,
          Longitude: pos.coords.longitude,
          Speed: pos.coords.speed || 0,
          Timestamp: new Date().toLocaleString(),
        });
        status.textContent = "Position sent ✓";
        loadTracking();
      } catch (err) {
        status.textContent = "Couldn't send: " + err.message;
      }
    },
    (err) => (status.textContent = "Location error: " + err.message),
    { enableHighAccuracy: true }
  );
});


// ===================================================================
// 16. MAINTENANCE / LICENSE-INSURANCE SUBTABS
// ===================================================================
function renderMaintenanceGroup() {
  const subtabs = document.querySelectorAll("#maintenanceSubtabs .subtab-btn");
  subtabs.forEach((btn) => {
    btn.onclick = () => {
      subtabs.forEach((b) => b.classList.toggle("active", b === btn));
      renderModule(btn.dataset.submodule, "maintenanceContent");
    };
  });
  const activeBtn = document.querySelector("#maintenanceSubtabs .subtab-btn.active") || subtabs[0];
  renderModule(activeBtn.dataset.submodule, "maintenanceContent");
}

function renderLicenseInsuranceGroup() {
  const subtabs = document.querySelectorAll("#licenseInsuranceSubtabs .subtab-btn");
  subtabs.forEach((btn) => {
    btn.onclick = () => {
      subtabs.forEach((b) => b.classList.toggle("active", b === btn));
      renderModule(btn.dataset.submodule, "licenseInsuranceContent");
    };
  });
  const activeBtn = document.querySelector("#licenseInsuranceSubtabs .subtab-btn.active") || subtabs[0];
  renderModule(activeBtn.dataset.submodule, "licenseInsuranceContent");
}


// ===================================================================
// 17. CHART ZOOM
// ===================================================================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".chart-zoom-btn");
  if (!btn) return;

  const targetId = btn.dataset.zoomTarget;
  const dir = btn.dataset.zoomDir;
  const current = chartZoomLevels_[targetId] || 1;
  const next = dir === "in" ? Math.min(current + 0.5, 4) : Math.max(current - 0.5, 1);
  chartZoomLevels_[targetId] = next;

  const inner = document.getElementById(targetId);
  if (inner) inner.style.width = `${next * 100}%`;
});


// ===================================================================
// 18. FUEL OVERVIEW
// ===================================================================
async function renderFuelOverview() {
  const container = document.getElementById("fuelOverview");
  if (!container) return;

  if (!cache.Vehicles) {
    try { cache.Vehicles = await Api.list("Vehicles"); }
    catch (err) { cache.Vehicles = []; }
  }

  const fuelLogs = cache.FuelLogs || [];
  const vehicles = cache.Vehicles || [];

  let dieselQty = 0, dieselCost = 0;
  let petrolQty = 0, petrolCost = 0;

  fuelLogs.forEach((r) => {
    const qty = Number(r.Liters) || 0;
    const cost = Number(r.Cost) || 0;
    const type = (r.Fueltype || "").toLowerCase().trim();
    if (type === "diesel") { dieselQty += qty; dieselCost += cost; }
    else if (type === "petrol") { petrolQty += qty; petrolCost += cost; }
  });

  const categories = [
    { label: "Bikes", icon: "🏍️", types: ["bike"] },
    { label: "Light", icon: "🚗", types: ["car", "jeep", "cab", "suv"] },
    { label: "Vans & Bus", icon: "🚐", types: ["van", "bus"] },
    { label: "Lorry", icon: "🚛", types: ["lorry", "truck"] },
    { label: "Land", icon: "🚜", types: ["tractor", "excavator", "jcb", "backhoe"] },
  ];

  const vehicleTypeMap = {};
  vehicles.forEach((v) => { vehicleTypeMap[String(v["Vehicle No"]).trim()] = (v.Type || "").toLowerCase().trim(); });

  const categoryTotals = categories.map((cat) => {
    let qty = 0, cost = 0, count = 0;
    fuelLogs.forEach((r) => {
      const vNo = String(r.VehicleID || "").trim();
      const vType = vehicleTypeMap[vNo] || "";
      if (vType && cat.types.some((t) => vType.includes(t))) {
        qty += Number(r.Liters) || 0;
        cost += Number(r.Cost) || 0;
        count += 1;
      }
    });
    return { ...cat, qty, cost, count };
  });

  const maxQty = Math.max(...categoryTotals.map((c) => c.qty), 1);

  const barsHtml = categoryTotals.map((cat) => {
      const pct = (cat.qty / maxQty) * 100;
      return `
      <div class="fuel-type-col">
        <div class="fuel-type-tooltip">
          <div class="tip-title">${cat.icon} ${cat.label}</div>
          <div class="tip-row"><span>Qty:</span><span>${formatLiters_(cat.qty)} Ltr</span></div>
          <div class="tip-row"><span>Cost:</span><span>${formatNumber_(cat.cost)}</span></div>
          <div class="tip-row"><span>Entries:</span><span>${cat.count}</span></div>
        </div>
        <div class="fuel-type-bar-wrap">
          <div class="fuel-type-bar" style="height: ${pct}%;"></div>
        </div>
        <div class="fuel-type-col-label">${cat.icon}</div>
      </div>
    `;
    }).join("");

  const yearsSet = new Set([new Date().getFullYear()]);
  fuelLogs.forEach((r) => { if (r.Date) yearsSet.add(new Date(r.Date).getFullYear()); });
  const years = Array.from(yearsSet).sort((a, b) => b - a);
  const defaultYear = years[0];

  const yearOptions = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

  let insideQty = 0, insideCost = 0, outsideQty = 0, outsideCost = 0;
  fuelLogs.forEach((r) => {
    const qty = Number(r.Liters) || 0;
    const cost = Number(r.Cost) || 0;
    const loc = (r.Location || "").toLowerCase().replace(/\s/g, "");
    if (loc.includes("out")) { outsideQty += qty; outsideCost += cost; }
    else if (loc.includes("in")) { insideQty += qty; insideCost += cost; }
  });

  container.innerHTML = `
    <div class="fuel-cards">
      <div class="fuel-card diesel">
        <div class="fuel-card-title">⛽ Diesel</div>
        <div class="fuel-card-qty">${formatLiters_(dieselQty)} Ltr</div>
        <div class="fuel-card-cost">Rs. ${Number(dieselCost).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
      </div>
      <div class="fuel-card petrol">
        <div class="fuel-card-title">⛽ Petrol</div>
        <div class="fuel-card-qty">${formatLiters_(petrolQty)} Ltr</div>
        <div class="fuel-card-cost">Rs. ${Number(petrolCost).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
      </div>
    </div>

    <div class="fuel-chart-container">
      <div class="fuel-chart-title">By Vehicle Type</div>
      <div class="fuel-chart-body">
        <div class="fuel-type-bars">${barsHtml}</div>
      </div>
    </div>

    <div class="fuel-monthly-container">
      <div class="fuel-monthly-head">
        <div class="fuel-monthly-title">Monthly Fuel Type — Qty</div>
        <select id="fuelMonthlyYear">${yearOptions}</select>
      </div>
      <div class="fuel-monthly-body" id="fuelMonthlyBody"></div>
      <div class="fuel-monthly-legend">
        <span><span class="swatch" style="background:#00245E"></span>Diesel</span>
        <span><span class="swatch" style="background:#d97706"></span>Petrol</span>
      </div>
    </div>

    <div class="fuel-location-container">
      <div class="fuel-location-title">By Location</div>
      <div class="fuel-location-body" id="fuelLocationBody"></div>
    </div>
  `;

  renderLocationPieChart_(insideQty, outsideQty, insideCost, outsideCost);

  const yearSelect = document.getElementById("fuelMonthlyYear");
  const renderMonthly = () => { renderMonthlyFuelLineChart_(Number(yearSelect.value)); };
  yearSelect?.addEventListener("change", renderMonthly);
  renderMonthly();
}

function renderMonthlyFuelLineChart_(year) {
  const body = document.getElementById("fuelMonthlyBody");
  if (!body) return;

  const fuelLogs = cache.FuelLogs || [];
  const dieselQty = new Array(12).fill(0);
  const dieselCost = new Array(12).fill(0);
  const petrolQty = new Array(12).fill(0);
  const petrolCost = new Array(12).fill(0);

  fuelLogs.forEach((r) => {
    if (!r.Date) return;
    const dt = new Date(r.Date);
    if (dt.getFullYear() !== year) return;
    const m = dt.getMonth();
    const qty = Number(r.Liters) || 0;
    const cost = Number(r.Cost) || 0;
    const type = (r.Fueltype || "").toLowerCase().trim();
    if (type === "diesel") { dieselQty[m] += qty; dieselCost[m] += cost; }
    else if (type === "petrol") { petrolQty[m] += qty; petrolCost[m] += cost; }
  });

  body.innerHTML = dualLineChartSvg_(dieselQty, petrolQty, dieselCost, petrolCost);

  body.querySelectorAll(".fuel-monthly-point-group").forEach((g) => {
    const tooltip = g.querySelector(".fuel-monthly-point-tooltip");
    if (!tooltip) return;
    g.addEventListener("mouseenter", () => tooltip.setAttribute("opacity", "1"));
    g.addEventListener("mouseleave", () => tooltip.setAttribute("opacity", "0"));
  });
}

function dualLineChartSvg_(qty1, qty2, cost1, cost2) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = 500, h = 130;
  const padL = 30, padR = 30, padT = 10, padB = 22;

  const maxVal = Math.max(...qty1, ...qty2, 1) * 1.15;
  const stepX = (w - padL - padR) / 11;
  const xFor = (i) => padL + stepX * i;
  const yFor = (v) => padT + (h - padT - padB) * (1 - v / maxVal);

  const pathFor = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`).join(" ");

  const pointsFor = (qtyArr, costArr, cls, label) => qtyArr.map((v, i) => {
        const cx = xFor(i);
        const cy = yFor(v);
        const monthName = months[i];
        const qtyText = Number(qtyArr[i]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Ltr";
        const costText = "Rs. " + Number(costArr[i]).toLocaleString("en-US", { maximumFractionDigits: 0 });
        const tipW = 75, tipH = 50;
        const tipX = cx - tipW / 2;
        const tipY = cy - tipH - 10;

        return `
        <g class="fuel-monthly-point-group">
          <circle cx="${cx}" cy="${cy}" r="12" fill="transparent" style="cursor:pointer"></circle>
          <circle class="fuel-monthly-dot ${cls}" cx="${cx}" cy="${cy}" r="2.5"></circle>
          <g class="fuel-monthly-point-tooltip ${cls}" opacity="0" style="pointer-events:none">
            <rect x="${tipX}" y="${tipY}" width="${tipW}" height="${tipH}" rx="5" fill="#00245E" opacity="0.95"></rect>
            <text x="${cx}" y="${tipY + 13}" text-anchor="middle" class="fuel-monthly-tip-title">${monthName} — ${label}</text>
            <text x="${tipX + 8}" y="${tipY + 26}" class="fuel-monthly-tip-row">Qty :</text>
            <text x="${tipX + tipW - 8}" y="${tipY + 26}" text-anchor="end" class="fuel-monthly-tip-value">${qtyText}</text>
            <text x="${tipX + 8}" y="${tipY + 37}" class="fuel-monthly-tip-row">Cost:</text>
            <text x="${tipX + tipW - 8}" y="${tipY + 37}" text-anchor="end" class="fuel-monthly-tip-value">${costText}</text>
          </g>
        </g>
      `;
      }).join("");

  const axisLabels = months.map((m, i) => `<text class="fuel-monthly-axis" x="${xFor(i)}" y="${h - 6}" text-anchor="middle">${m}</text>`).join("");

  const gridLines = [0.25, 0.5, 0.75].map((p) => {
      const y = padT + (h - padT - padB) * p;
      return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#eef1f7" stroke-width="1" stroke-dasharray="3,3"></line>`;
    }).join("");

  return `
    <svg class="fuel-monthly-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <line class="chart-axis-line" x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" />
      <line class="chart-axis-line" x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" />
      ${gridLines}
      <path class="fuel-monthly-line diesel" d="${pathFor(qty1)}"></path>
      <path class="fuel-monthly-line petrol" d="${pathFor(qty2)}"></path>
      ${pointsFor(qty1, cost1, "diesel", "Diesel")}
      ${pointsFor(qty2, cost2, "petrol", "Petrol")}
      ${axisLabels}
    </svg>
  `;
}

function renderLocationPieChart_(insideQty, outsideQty, insideCost, outsideCost) {
  const body = document.getElementById("fuelLocationBody");
  if (!body) return;

  const total = insideQty + outsideQty;
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const insidePct = total > 0 ? insideQty / total : 0;
  const insideLen = circumference * insidePct;
  const outsideLen = circumference - insideLen;

  const fmtQty = (v) => Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCost = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

  body.innerHTML = `
    <svg class="fuel-location-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="#eef1f7" stroke-width="14"/>
      ${total > 0 ? `
        <circle class="slice" cx="50" cy="50" r="${r}" fill="none" stroke="#00245E" stroke-width="14"
                stroke-dasharray="${insideLen} ${circumference - insideLen}" stroke-dashoffset="0" transform="rotate(-90 50 50)">
          <title>In Side: ${fmtQty(insideQty)} Ltr / Rs.${fmtCost(insideCost)}</title>
        </circle>
        <circle class="slice" cx="50" cy="50" r="${r}" fill="none" stroke="#d97706" stroke-width="14"
                stroke-dasharray="${outsideLen} ${insideLen}" stroke-dashoffset="${-insideLen}" transform="rotate(-90 50 50)">
          <title>Out Side: ${fmtQty(outsideQty)} Ltr / Rs.${fmtCost(outsideCost)}</title>
        </circle>
      ` : ""}
      <text x="50" y="48" text-anchor="middle" class="pie-center-value">${Math.round(total)}</text>
      <text x="50" y="58" text-anchor="middle" class="pie-center-label">LTR</text>
    </svg>
    <div class="fuel-location-legend">
      <span class="legend-chip"><span class="swatch" style="background:#00245E"></span>In Side</span>
      <span class="legend-chip"><span class="swatch" style="background:#d97706"></span>Out Side</span>
    </div>
  `;
}


// ===================================================================
// 19. USER SETTINGS VIEW
// ===================================================================
const settingsBtn = document.getElementById("settingsBtn");

(function initSettingsVisibility_() {
  if (!currentUser || !settingsBtn) return;
  const isAdmin = String(currentUser.role || "").toLowerCase() === "admin" || String(currentUser.username || "").toLowerCase() === "admin";
  if (isAdmin) settingsBtn.style.display = "flex";
})();

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => showSettingsView_());
}

const _origShowView = showView;
showView = function (key) {
  if (key === "settings") {
    navItems.forEach((b) => b.classList.remove("active"));
    views.forEach((v) => v.classList.toggle("active", v.id === "view-settings"));
    viewTitle.textContent = "User Settings";
    sidebar.classList.remove("open");
    renderSettingsView_();
    return;
  }
  _origShowView(key);
};

async function showSettingsView_() {
  showView("settings");
}

async function renderSettingsView_() {
  const root = document.getElementById("view-settings");
  if (!root) return;

  root.innerHTML = `
    <div class="view-head">
      <h1>👥 User Settings</h1>
      <p class="sub">Manage user accounts, passwords and per-tab access permissions.</p>
    </div>
    <div class="toolbar">
      <input type="search" placeholder="Search users…" id="search-users">
      <button class="btn btn-primary" id="saveUsersBtn">💾 Save All Changes</button>
    </div>
    <div class="panel">
      <div class="panel-body table-scroll" id="usersListContainer">
        <p class="hint">Loading users…</p>
      </div>
    </div>
    <p id="usersSaveStatus" class="hint" style="margin-top:8px;"></p>
  `;

  document.getElementById("search-users")?.addEventListener("input", (e) => { paintUsersList_(e.target.value); });
  document.getElementById("saveUsersBtn")?.addEventListener("click", saveUserChanges_);

  usersCache_ = null;
  Object.keys(pendingChanges_).forEach((k) => delete pendingChanges_[k]);

  try {
    usersCache_ = await Api.list("Users");
    paintUsersList_("");
  } catch (err) {
    document.getElementById("usersListContainer").innerHTML = `<p class="hint">❌ Couldn't load users — ${err.message}</p>`;
  }
}

const SETTINGS_TABS_ = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "vehicles", label: "Vehicle Master", icon: "🚗" },
  { key: "drivers", label: "User Master", icon: "👨‍✈️" },
  { key: "fuel", label: "Fuel", icon: "⛽" },
  { key: "Lubricant", label: "Lubricant", icon: "🛢️" },
  { key: "maintenance", label: "Service & Maint.", icon: "🔧" },
  { key: "licenseInsurance", label: "License & Ins.", icon: "🛡️" },
  { key: "Accident", label: "Accident", icon: "⚠️" },
  { key: "tracking", label: "Tracking", icon: "📍" },
];

function paintUsersList_(filterText) {
  const container = document.getElementById("usersListContainer");
  if (!container) return;

  if (!usersCache_ || !usersCache_.length) {
    container.innerHTML = `<p class="hint">No users found.</p>`;
    return;
  }

  const rows = usersCache_.filter((u) => JSON.stringify(u).toLowerCase().includes((filterText || "").toLowerCase()));

  if (!rows.length) {
    container.innerHTML = `<p class="hint">No matching users.</p>`;
    return;
  }

  container.innerHTML = rows.map((u) => renderUserCard_(u)).join("");

  container.querySelectorAll(".user-card").forEach((card) => {
    const id = card.dataset.id;
    const origUser = usersCache_.find((x) => String(x.ID ?? x.Id ?? x.id) === String(id));

    const pwdInput = card.querySelector(".pwd-input");
    pwdInput.addEventListener("input", () => {
      const origPwd = origUser ? origUser.Password || "" : "";
      if (pwdInput.value !== origPwd) {
        setPending_(id, "Password", pwdInput.value);
        card.classList.add("user-changed");
      } else {
        clearPending_(id, "Password");
        checkCardChanged_(card, id);
      }
    });

    card.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const group = cb.dataset.group;
        const colName = groupToColumn_(group);
        const origValue = origUser ? String(origUser[colName] || "") : "";
        const origArr = origValue.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const currentArr = getCurrentCheckboxValue_(card, group);

        const changed = !arraysEqual_(currentArr.map((s) => s.toLowerCase()), origArr);
        if (changed) {
          setPending_(id, colName, currentArr.join(","));
          card.classList.add("user-changed");
        } else {
          clearPending_(id, colName);
          checkCardChanged_(card, id);
        }
      });
    });
  });
}

function renderUserCard_(u) {
  const id = u.ID ?? u.Id ?? u.id;
  const pwd = pendingChanges_[id]?.Password ?? (u.Password || "");
  const isAdmin = String(u.Role || "").toLowerCase() === "admin";

  const allowedArr = String(u.AllowedTabs || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const noEditArr = String(u.NoEditTabs || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const noDeleteArr = String(u.NoDeleteTabs || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  const isAllAllowed = allowedArr.length === 0;

  const checkboxesFor_ = (group, arr, isAllAllowed) => SETTINGS_TABS_.map((t) => {
      const checked = group === "allowed" ? isAllAllowed || arr.includes(t.key.toLowerCase()) : arr.includes(t.key.toLowerCase());
      return `
      <label class="perm-chip ${group}" title="${t.label}">
        <input type="checkbox" data-group="${group}" data-tab="${t.key}" ${checked ? "checked" : ""}>
        <span class="perm-icon">${t.icon}</span>
        <span class="perm-label">${t.label}</span>
      </label>
    `;
    }).join("");

  return `
    <div class="user-card" data-id="${id}">
      <div class="user-card-head">
        <div class="user-card-title">
          <span class="user-avatar">${(u.Username || "?")[0].toUpperCase()}</span>
          <span class="user-uname">${u.Username || ""}</span>
          <span class="user-role ${isAdmin ? "admin" : "staff"}">${u.Role || "Staff"}</span>
        </div>
        <label class="user-pwd-field">
          <span>🔑 Password</span>
          <input type="text" class="pwd-input" value="${pwd}" placeholder="Password">
        </label>
      </div>
      <div class="perm-section">
        <div class="perm-section-title allowed-title">✅ Allowed Tabs</div>
        <div class="perm-chip-row">${checkboxesFor_("allowed", allowedArr, isAllAllowed)}</div>
      </div>
      <div class="perm-section">
        <div class="perm-section-title noedit-title">✏️ No Edit Tabs</div>
        <div class="perm-chip-row">${checkboxesFor_("noedit", noEditArr, false)}</div>
      </div>
      <div class="perm-section">
        <div class="perm-section-title nodelete-title">🗑️ No Delete Tabs</div>
        <div class="perm-chip-row">${checkboxesFor_("nodelete", noDeleteArr, false)}</div>
      </div>
    </div>
  `;
}

function groupToColumn_(group) {
  if (group === "allowed") return "AllowedTabs";
  if (group === "noedit") return "NoEditTabs";
  if (group === "nodelete") return "NoDeleteTabs";
  return "";
}
function getCurrentCheckboxValue_(card, group) {
  const boxes = card.querySelectorAll(`input[data-group="${group}"]:checked`);
  return Array.from(boxes).map((b) => b.dataset.tab);
}
function arraysEqual_(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
function setPending_(id, col, value) {
  if (!pendingChanges_[id]) pendingChanges_[id] = {};
  pendingChanges_[id][col] = value;
}
function clearPending_(id, col) {
  if (pendingChanges_[id]) {
    delete pendingChanges_[id][col];
    if (Object.keys(pendingChanges_[id]).length === 0) delete pendingChanges_[id];
  }
}
function checkCardChanged_(card, id) {
  if (!pendingChanges_[id] || Object.keys(pendingChanges_[id]).length === 0) {
    card.classList.remove("user-changed");
  }
}

async function saveUserChanges_() {
  const status = document.getElementById("usersSaveStatus");
  const btn = document.getElementById("saveUsersBtn");
  const ids = Object.keys(pendingChanges_);

  if (!ids.length) {
    status.textContent = "වෙනස්කම් නැහැ.";
    status.style.color = "#888";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Saving…";
  status.textContent = "";

  let ok = 0, fail = 0;
  for (const id of ids) {
    const original = usersCache_.find((u) => String(u.ID ?? u.Id ?? u.id) === String(id));
    if (!original) { fail++; continue; }

    const changes = pendingChanges_[id];
    const payload = {
      ID: original.ID ?? original.Id ?? original.id,
      Username: original.Username,
      Password: changes.Password !== undefined ? changes.Password : original.Password || "",
      Role: original.Role || "Staff",
      AllowedTabs: changes.AllowedTabs !== undefined ? changes.AllowedTabs : original.AllowedTabs || "",
      NoEditTabs: changes.NoEditTabs !== undefined ? changes.NoEditTabs : original.NoEditTabs || "",
      NoDeleteTabs: changes.NoDeleteTabs !== undefined ? changes.NoDeleteTabs : original.NoDeleteTabs || "",
    };

    try {
      await Api.update("Users", payload, currentUser.username);
      ok++;
    } catch (err) {
      fail++;
      console.error("Failed to update user", id, err);
    }
  }

  btn.disabled = false;
  btn.textContent = "💾 Save All Changes";

  if (fail === 0) {
    status.textContent = `✅ ${ok} user updated successfully.`;
    status.style.color = "#16a34a";
  } else {
    status.textContent = `⚠️ ${ok} succeeded, ${fail} failed.`;
    status.style.color = "#d97706";
  }

  try {
    usersCache_ = await Api.list("Users");
    Object.keys(pendingChanges_).forEach((k) => delete pendingChanges_[k]);
    paintUsersList_(document.getElementById("search-users").value);
  } catch (_) {}
}


// ===================================================================
// 20. INIT
// ===================================================================
(async function init() {
  const statusEl = document.getElementById("apiStatus");
  try {
    const isConnected = await Api.ping();
    statusEl.textContent = isConnected ? "✅ connected" : "❌ not connected";
    statusEl.style.color = isConnected ? "var(--green)" : "var(--red)";
    if (!isConnected) {
      console.warn("⚠️ API not reachable. Check API_URL in config.js");
    }
  } catch (err) {
    statusEl.textContent = "❌ error: " + err.message;
    statusEl.style.color = "var(--red)";
  }
  loadDashboard();
})();

// ===================================================================
// 21. VEHICLE BOOKING & CALENDAR VIEW
// ===================================================================
let bookingCalendar = null;

async function loadBookingsView() {
  const calendarEl = document.getElementById("bookingCalendar");
  if (!calendarEl) return;

  // ✅ Driver Filter එක Populate කරන්න
  const driverFilter = document.getElementById("bookFilterDriver");
  if (driverFilter && !driverFilter.dataset.populated) {
    try {
      const drivers = cache.Drivers || (await Api.list("Drivers"));
      cache.Drivers = drivers;
      const driverNames = drivers.map(d => d.Name).filter(Boolean);
      
      driverFilter.innerHTML = `<option value="All">All Drivers</option>` + 
        driverNames.map(d => `<option value="${d}">${d}</option>`).join("");
      driverFilter.dataset.populated = "true";
    } catch (err) {
      console.warn("Drivers load failed", err);
    }
  }

  // දැනටමත් Calendar එකක් හදලා තියෙනවා නම් ආපහු හදන්නේ නැහැ
  if (!bookingCalendar) {
    bookingCalendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      height: '100%',
      events: [],
      dateClick: function(info) {
        loadBookingsForDate(info.dateStr);
      },
      eventClick: function(info) {
        const d = info.event.startStr.split('T')[0];
        loadBookingsForDate(d);
      }
    });
    bookingCalendar.render();
  }

  await fetchAndRenderBookings_();
}

async function fetchAndRenderBookings_() {
  try {
    const bookings = await Api.list("Bookings");
    cache.Bookings = bookings;

    // 1. දත්ත දින අනුව කාණ්ඩ කිරීම (Group by Date)
    const bookingsByDate = {};
    
    // දිනය format කරන helper එකක් (YYYY-MM-DD)
    const formatDate = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    bookings.forEach(b => {
      if (!b["From Date"] || !b["To Date"]) return;
      // Reject කරපු ඒවා Calendar එකේ පෙන්නන්නේ නැතුව ඉන්න (ඕන නම් මේ පේළිය අයින් කරන්න)
      if (b.Status === "Rejected") return; 

      let start = new Date(b["From Date"]);
      let end = new Date(b["To Date"]);

      // From Date ඉඳන් To Date වෙනකම් දවස් ගානේ loop වෙනවා
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        if (!bookingsByDate[dateStr]) {
          bookingsByDate[dateStr] = [];
        }
        bookingsByDate[dateStr].push(b);
      }
    });

    // 2. එක එක දවසට Events හදන්න (Count එක පෙන්නන්න)
    const events = Object.keys(bookingsByDate).map(dateStr => {
      const dayBookings = bookingsByDate[dateStr];
      const count = dayBookings.length;
      
      // එදාට Pending ඒවා තියෙනවද බලලා පාට තීරණය කරමු
      const hasPending = dayBookings.some(b => b.Status === "Pending");
      const bgColor = hasPending ? "#d97706" : "#16a34a"; // Pending = කහ, Approved = කොළ

      // "02 Bookings" විදියට format කරන්න (අංක 2කින් පෙන්නන්න)
      const countStr = count.toString().padStart(2, '0');
      const title = `${countStr} Booking${count > 1 ? 's' : ''}`;

      return {
        title: title,
        start: dateStr,
        allDay: true, 
        backgroundColor: bgColor,
        borderColor: bgColor,
        textColor: '#ffffff'
      };
    });

    bookingCalendar.removeAllEvents();
    bookingCalendar.addEventSource(events);

  } catch (err) {
    console.error("Bookings load error:", err);
  }
}

function loadBookingsForDate(dateStr) {
  const titleEl = document.getElementById("selectedDateTitle");
  const listEl = document.getElementById("bookingDetailsList");
  
  if (!dateStr) {
    titleEl.textContent = `Select a date`;
    return;
  }

  titleEl.textContent = `Bookings: ${dateStr}`;
  
  // Filter Values ලබා ගැනීම
  const vFilter = (document.getElementById("bookFilterVehicle")?.value || "").toLowerCase().trim();
  const dFilter = document.getElementById("bookFilterDriver")?.value || "All";
  const tFilter = document.getElementById("bookFilterTime")?.value || "All";

  // දත්ත Filter කිරීම
  const bookings = (cache.Bookings || []).filter(b => {
    // 1. දිනය ගැලපේද බැලීම
    const isDateMatch = dateStr >= b["From Date"] && dateStr <= b["To Date"];
    if (!isDateMatch) return false;

    // 2. Vehicle No එක ගැලපේද බැලීම
    const isVehicleMatch = String(b["Vehicle No"] || "").toLowerCase().includes(vFilter);
    if (!isVehicleMatch) return false;

    // 3. Driver ගැලපේද බැලීම
    if (dFilter !== "All") {
      if (String(b["Driver Name"] || "").trim() !== dFilter) return false;
    }

    // 4. වෙලාව ගැලපේද බැලීම
    if (tFilter !== "All") {
      const fromTime = b["From Time"] || "00:00";
      const hour = parseInt(fromTime.split(":")[0], 10);
      
      if (tFilter === "Morning" && (hour < 6 || hour >= 12)) return false;
      if (tFilter === "Afternoon" && (hour < 12 || hour >= 18)) return false;
      if (tFilter === "Evening" && hour < 18) return false;
    }

    return true;
  });

  if (!bookings.length) {
    listEl.innerHTML = `<div class="expiring-empty"><span style="font-size:24px; margin-bottom:8px;">📭</span><p>No bookings found for this filter.</p></div>`;
    return;
  }

  listEl.innerHTML = bookings.map(b => {
    const statusClass = b.Status === "Approved" ? "status-approved" : (b.Status === "Rejected" ? "status-rejected" : "status-pending");
    
    // Transport Officer ට ඕනෑම වෙලාවක Approve/Reject කරන්න පුළුවන් වෙන්න ඕන නිසා (කලින් Admin ට විතරක් තිබ්බ එක අයින් කළා)
    const showActions = b.Status === "Pending";

    // වෙලාව ලස්සනට පෙන්නන්න (උදා: 08:30 AM)
        // වෙලාව ලස්සනට පෙන්නන්න (ඕනෑම format එකකට වැඩ කරන්න)
    const formatTime = (timeStr) => {
      if (!timeStr) return "--:--";
      
      let timeOnly = timeStr;

      // 1. Google Sheets වලින් Date String එකක් ආවොත් (උදා: 2026-11-02T08:00:00.000Z)
      if (typeof timeStr === "string" && timeStr.includes("T")) {
        timeOnly = timeStr.split("T")[1].substring(0, 5);
      }

      // 2. සාමාන්‍ය වෙලාවක් ආවොත් (උදා: 08:00)
      if (typeof timeOnly === "string" && timeOnly.includes(":")) {
        let [h, m] = timeOnly.split(":");
        h = parseInt(h, 10);
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
      }

      return timeStr; // අවසාන වශයෙන් එහෙම්මම යවන්න
    };

    return `
      <div class="booking-item">
        <div class="booking-item-header">
          <span class="booking-vehicle">${b["Vehicle No"]}</span>
          <span class="booking-time-pill">🕒 ${formatTime(b["From Time"])} - ${formatTime(b["To Time"])}</span>
        </div>
        
        <div class="booking-details-grid">
          <span>Driver:</span> <span><b>${b["Driver Name"] || "Not Assigned"}</b></span>
          <span>Requested By:</span> <span>${b["Requested By"]} (${b["Department"]})</span>
          <span>Destination:</span> <span>${b["Destination"]}</span>
          <span>Purpose:</span> <span>${b["Purpose"]}</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="booking-status-badge ${statusClass}">${b.Status}</span>
          ${b["Approved By"] ? `<span style="font-size:10px; color:#999;">By: ${b["Approved By"]}</span>` : ""}
        </div>

        ${showActions ? `
          <div class="booking-actions">
            <button class="btn-approve" onclick="updateBookingStatus('${b.ID}', 'Approved')">Approve</button>
            <button class="btn-reject" onclick="updateBookingStatus('${b.ID}', 'Rejected')">Reject</button>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

async function updateBookingStatus(id, newStatus) {
  if (!confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;
  
  const booking = cache.Bookings.find(b => String(b.ID) === String(id));
  if (!booking) return;

  try {
    const payload = {
      ID: id,
      Status: newStatus,
      "Approved By": currentUser.username
    };
    await Api.update("Bookings", payload, currentUser.username);
    
    // Refresh data
    await fetchAndRenderBookings_();
    
    // Refresh the detail list (using the currently selected date)
    const titleText = document.getElementById("selectedDateTitle").textContent;
    const dateStr = titleText.replace("Bookings for ", "");
    loadBookingsForDate(dateStr);
    
  } catch (err) {
    alert("Couldn't update status: " + err.message);
  }
}

// Filter වලට Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const vFilterInput = document.getElementById("bookFilterVehicle");
  const tFilterSelect = document.getElementById("bookFilterTime");

  if (vFilterInput && tFilterSelect) {
    const applyFilter = () => {
      const titleText = document.getElementById("selectedDateTitle").textContent;
      const dateStr = titleText.replace("Bookings: ", "");
      if (dateStr !== "Select a date") {
        loadBookingsForDate(dateStr);
      }
    };

    vFilterInput.addEventListener("input", applyFilter);
    tFilterSelect.addEventListener("change", applyFilter);
    
    // ✅ Driver Filter එකටත් Event Listener එක දාන්න
    const dFilterSelect = document.getElementById("bookFilterDriver");
    if (dFilterSelect) {
      dFilterSelect.addEventListener("change", applyFilter);
    }
  }
});

// ===================================================================
// 22. BOOKING REPORT DOWNLOAD (CSV / PDF)
// ===================================================================
document.addEventListener("DOMContentLoaded", () => {
  const reportBtn = document.getElementById("downloadReportBtn");
  const reportModal = document.getElementById("reportModalBackdrop");
  const closeReportBtn = document.getElementById("closeReportModalBtn");
  const csvBtn = document.getElementById("downloadCsvBtn");
  const pdfBtn = document.getElementById("downloadPdfBtn");

  if (reportBtn && reportModal) {
    // 1. Open Modal
    reportBtn.addEventListener("click", () => {
      // Set today's date as default
      const today = new Date().toISOString().split("T")[0];
      if (!document.getElementById("reportFromDate").value) {
        document.getElementById("reportFromDate").value = today;
        document.getElementById("reportToDate").value = today;
      }
      reportModal.classList.add("open");
    });

    // 2. Close Modal
    closeReportBtn.addEventListener("click", () => {
      reportModal.classList.remove("open");
    });

    // 3. Filter Data Function
    const getFilteredBookings_ = () => {
      const fromDate = document.getElementById("reportFromDate").value;
      const toDate = document.getElementById("reportToDate").value;
      
      if (!fromDate || !toDate) {
        alert("Please select both dates.");
        return null;
      }

      return (cache.Bookings || []).filter(b => {
        // Check if Booking Date Range overlaps with Filter Date Range
        return (b["From Date"] <= toDate && b["To Date"] >= fromDate);
      });
    };

    // 4. CSV Download
    csvBtn.addEventListener("click", () => {
      const data = getFilteredBookings_();
      if (!data) return;

      if (data.length === 0) {
        alert("No bookings found for this date range.");
        return;
      }

      const headers = ["ID", "Vehicle No", "Driver Name", "Requested By", "Department", "From Date", "From Time", "To Date", "To Time", "Destination", "Purpose", "Status", "Approved By"];
      
      // Build CSV String
      const csvRows = [];
      csvRows.push(headers.join(",")); // Headers

      data.forEach(b => {
        const row = headers.map(h => {
          let val = b[h] === undefined || b[h] === null ? "" : b[h].toString();
          return `"${val.replace(/"/g, '""')}"`; // Escape commas
        });
        csvRows.push(row.join(","));
      });

      // Add BOM (\uFEFF) for Excel UTF-8 support
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `Booking_Report_${document.getElementById("reportFromDate").value}_to_${document.getElementById("reportToDate").value}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // 5. PDF Download (via Print Window)
    pdfBtn.addEventListener("click", () => {
      const data = getFilteredBookings_();
      if (!data) return;

      if (data.length === 0) {
        alert("No bookings found for this date range.");
        return;
      }

      const fromDate = document.getElementById("reportFromDate").value;
      const toDate = document.getElementById("reportToDate").value;

      // Build HTML Table for Print
      let tableRows = data.map(b => `
        <tr>
          <td>${b["Vehicle No"]}</td>
          <td>${b["Requested By"]}</td>
          <td>${b["Department"]}</td>
          <td>${b["From Date"]} ${b["From Time"] || ""}</td>
          <td>${b["To Date"]} ${b["To Time"] || ""}</td>
          <td>${b["Destination"]}</td>
          <td>${b["Status"]}</td>
        </tr>
      `).join("");

      const printContent = `
        <html>
        <head>
          <title>Booking Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; color: #00245E; margin-bottom: 5px; }
            p { text-align: center; font-size: 12px; color: #555; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #00245E; color: white; }
          </style>
        </head>
        <body>
          <h2>Vehicle Booking Report</h2>
          <p>From ${fromDate} To ${toDate}</p>
          <table>
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th>Driver Name</th>
                <th>Requested By</th>
                <th>Department</th>
                <th>From</th>
                <th>To</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
        </html>
      `;

      // Open a new window and trigger Print Dialog (User can Save as PDF)
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    });
  }
});