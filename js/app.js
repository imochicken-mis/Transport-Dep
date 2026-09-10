// ===================================================================
// MODULE DEFINITIONS
// Each key maps to one Google Sheet tab. Add/remove fields here and
// the table + add/edit form regenerate automatically.
// ===================================================================

// ===== Single Row HTML Generator (DOM එකට එක් පේළියක් එකතු කිරීමට) =====
function renderSingleRow(key, row) {
  const mod = MODULES[key];
  const noEditTabs = (currentUser && currentUser.noEditTabs) || [];
  const noDeleteTabs = (currentUser && currentUser.noDeleteTabs) || [];
  const canEdit = !noEditTabs.includes(key.toLowerCase());
  const canDelete = !noDeleteTabs.includes(key.toLowerCase());

  return `<tr data-id="${row[mod.idField]}">
    ${mod.fields.map((f) => `<td>${statusCell(f, row[f.key])}</td>`).join("")}
    <td class="row-actions">
      ${canEdit ? `<button title="Edit" onclick='openForm("${key}", ${JSON.stringify(row).replace(/'/g, "&apos;")})'>✎</button>` : ""}
      ${canDelete ? `<button title="Delete" onclick='removeRow("${key}", "${row[mod.idField]}")'>🗑</button>` : ""}
    </td>
  </tr>`;
}

function getVehicleTypeIcon(categoryKey) {
  const map = {
    'Bikes': '🏍️',
    'Luxury Vehicles': '🚗',
    'Vans & Bus': '🚐',
    'Lorry': '🚛',
    'Land Vehicles': '🚜'
  };
  return map[categoryKey] || '🚗';
}

function renderVehicleStatsCards() {
  const container = document.getElementById('vehicleStatsCards');
  if (!container) return;
  
  const vehicles = cache.Vehicles || [];
  
  // කාණ්ඩ 5
  const categories = [
    { key: 'Bikes', types: ['bike'], label: 'Motor Bikes' },
    { key: 'Luxury Vehicles', types: ['car', 'jeep', 'cab', 'suv'], label: 'Light Vehicles' },
    { key: 'Vans & Bus', types: ['van', 'bus'], label: 'Vans & Buses (transport)' },
    { key: 'Lorry', types: ['lorry', 'truck'], label: 'Freezer Trucks & Lorries' },
    { key: 'Land Vehicles', types: ['tractor', 'excavator', 'jcb', 'backhoe'], label: 'Land Vehicles' }
  ];

  let html = `<div class="stats-row">`;
  
  categories.forEach(cat => {
    // Type එක ගැලපෙන vehicles හොයන්න
    const filtered = vehicles.filter(v => {
      const type = (v.Type || '').toLowerCase().trim();
      return cat.types.some(t => type.includes(t));
    });
    
    const total = filtered.length;
    
    // Distinct Models ගණන (හිස් නොවන Model ගණන් කරන්න)
    const models = new Set(
      filtered.map(v => (v.Model || '').toLowerCase().trim()).filter(m => m !== '')
    );
    const modelCount = models.size;

    // Status counts
    const activeCount    = filtered.filter(v => (v.Status || '').trim() === 'Active').length;
    const inServiceCount = filtered.filter(v => (v.Status || '').trim() === 'In Service').length;
    const inactiveCount  = filtered.filter(v => (v.Status || '').trim() === 'Inactive').length;

        html += `
      <div class="stat-card accent-${cat.key.toLowerCase().replace(/[^a-z]/g, '')}">
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
      { key: "Name", label: "Driver Name", type: "text", required: true },
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
    ]
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
    ]
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
    ]
  }
};

const cache = {}; // sheet -> rows, refreshed on each view load

// ---- Current session ----
const currentUser = JSON.parse(sessionStorage.getItem("vms_user") || "null");
if (currentUser) {
  document.getElementById("footUser").textContent = `${currentUser.username} (${currentUser.role || "Staff"})`;
}

function applyTabPermissions_(user) {
  const allowed = (user.allowedTabs || []).map((t) => t.toLowerCase());
  if (allowed.length === 0) return; // empty list = full access

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

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("vms_user");
  window.location.href = "login.html";
});

// ===================================================================
// NAVIGATION
// ===================================================================
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("viewTitle");
const sidebar = document.getElementById("sidebar");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

if (currentUser) applyTabPermissions_(currentUser);
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ==========================================
// SIDEBAR TOGGLE (Desktop)
// ==========================================
const sidebarToggleBtn = document.getElementById("sidebarToggle");
if (sidebarToggleBtn) {
  // පෙර state එක localStorage එකෙන් restore කරන්න
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
    
    // State එක save කරන්න
    const collapsed = shell.classList.contains("sidebar-collapsed");
    localStorage.setItem("vms_sidebar_collapsed", collapsed ? "true" : "false");
    
    // Leaflet map එකක් තියෙනවා නම් resize
    setTimeout(() => {
      if (window.map && typeof window.map.invalidateSize === "function") {
        window.map.invalidateSize();
      }
    }, 320);
  });
}

function showView(key) {
  navItems.forEach((b) => b.classList.toggle("active", b.dataset.view === key));
  views.forEach((v) => v.classList.toggle("active", v.id === `view-${key}`));
  const navLabel = document.querySelector(`.nav-item[data-view="${key}"]`);
  viewTitle.textContent = navLabel ? navLabel.textContent.trim() : key;
  sidebar.classList.remove("open");

  if (key === "maintenance") { renderMaintenanceGroup(); }
  else if (key === "licenseInsurance") { renderLicenseInsuranceGroup(); }
  else if (MODULES[key]) renderModule(key);
  if (key === "dashboard") loadDashboard();
  if (key === "tracking") loadTracking()
}

// ===================================================================
// GENERIC CRUD RENDERER
// ===================================================================
const moduleTargets = {};

async function renderModule(key, targetId) {
  const mod = MODULES[key];
  const resolvedTarget = targetId || `view-${key}`;
  moduleTargets[key] = resolvedTarget;
  const root = document.getElementById(resolvedTarget);
  if (root.dataset.rendered === "true") {
    return; // මෙතැනදීම function එක නවත්වන්න. table එක එලෙසම පෙනෙයි.
  }
    // Vehicle Master නම් පමණක් Cards Container එක එකතු කරන්න
  let cardsHtml = '';
  if (key === 'vehicles') {
    cardsHtml = `<div id="vehicleStatsCards" class="stats-card-container"></div>`;
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
        ${mod.fields.map((f) => `<th>${f.label}</th>`).join("")}
        <th></th>
      </tr></thead>
      <tbody id="tbody-${key}"><tr><td colspan="${mod.fields.length + 1}">Loading…</td></tr></tbody>
      </table>
    </div></div>`;

  document.getElementById(`addBtn-${key}`).addEventListener("click", () => openForm(key));
  document.getElementById(`search-${key}`).addEventListener("input", (e) => paintRows(key, e.target.value));

  try {
    const rows = await Api.list(mod.sheet);
    cache[mod.sheet] = rows;
    paintRows(key, "");
      // Vehicles නම් Cards පෙන්වන්න
  if (key === 'vehicles') {
    renderVehicleStatsCards();
  }
    root.dataset.rendered = "true";
  } catch (err) {
    document.getElementById(`tbody-${key}`).innerHTML =
      `<tr><td colspan="${mod.fields.length + 1}">❌ Couldn't load data — ${err.message}</td></tr>`;
  }
}

function paintRows(key, filterText) {
  const mod = MODULES[key];
  const rows = (cache[mod.sheet] || []).filter((r) =>
    JSON.stringify(r).toLowerCase().includes(filterText.toLowerCase())
  );
  const tbody = document.getElementById(`tbody-${key}`);
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${mod.fields.length + 1}">No records yet.</td></tr>`;
    return;
  }
  const noEditTabs = (currentUser && currentUser.noEditTabs) || [];
  const noDeleteTabs = (currentUser && currentUser.noDeleteTabs) || [];
  const canEdit = !noEditTabs.includes(key.toLowerCase());
  const canDelete = !noDeleteTabs.includes(key.toLowerCase());
    tbody.innerHTML = rows
    .map(
      (r) => `<tr data-id="${r[mod.idField]}">
        ${mod.fields.map((f) => `<td>${statusCell(f, r[f.key])}</td>`).join("")}
        <td class="row-actions">
          ${canEdit ? `<button title="Edit" onclick='openForm("${key}", ${JSON.stringify(r).replace(/'/g, "&apos;")})'>✎</button>` : ""}
          ${canDelete ? `<button title="Delete" onclick='removeRow("${key}", "${r[mod.idField]}")'>🗑</button>` : ""}
        </td>
      </tr>`
    )
    .join("");
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

function formatNumber_(value) {
  const n = Number(value);
  if (isNaN(n)) return value ?? "";
  return "Rs. " + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ===================================================================
// MODAL FORM
// ===================================================================
const modalBackdrop = document.getElementById("modalBackdrop");
const modalForm = document.getElementById("modalForm");
const modalTitle = document.getElementById("modalTitle");
document.getElementById("modalCloseBtn").addEventListener("click", closeForm);

let activeModuleKey = null;

function openForm(key, existing) {
  activeModuleKey = key;
  const mod = MODULES[key];
  const singularName = mod.singular || mod.title.slice(0, -1);
  modalTitle.textContent = existing ? `Edit ${singularName}` : `Add ${singularName}`;

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
        return `<label class="field"><span>${f.label}</span>
          <input name="${f.key}" value="${val}" ${f.required ? "required" : ""}>
        </label>`;
      })
              .join("") + `<button class="btn btn-primary" type="submit" id="modalSubmitBtn">${existing ? "Save changes" : "Add"}</button>`;

  if (existing) modalForm.dataset.id = existing[mod.idField];
  else delete modalForm.dataset.id;

  // 🔹 FIX: Auto-computed fields (LicenseExpiry / InsuranceExpiry)
  const computedField = mod.fields.find((f) => f.computedFrom);
  if (computedField) {
    const sourceInput = modalForm.querySelector(`[name="${computedField.computedFrom}"]`);
    if (sourceInput) {
      // If editing, we may already have a value in the computed field
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
        // Show in read-only field if it exists
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

// 🔹 FIX: Submit with computed fields
modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // ----- Submit Button එක හොයාගෙන disable කිරීම -----
  const submitBtn = modalForm.querySelector('#modalSubmitBtn');
  const originalText = submitBtn.textContent; // "Add" හෝ "Save changes"
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  // -------------------------------------------------

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

        if (isUpdate) {
      data[mod.idField] = modalForm.dataset.id;   // ✅ "ID" ලෙස set කරනවා (mod.idField = "ID")
      await Api.update(mod.sheet, data);
    } else {
      response = await Api.add(mod.sheet, data);
      data[mod.idField] = response.id;
    }

    // ----- Save උනාට පස්සේ Button එක නැවත හරවන්න (Modal එක වැසීමට කලින්) -----
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    closeForm();

    // ----- ඉතිරි Cache / DOM Update Logic එක (කලින් කියාපු විදියටම) -----
    const key = activeModuleKey;
    const searchInput = document.getElementById(`search-${key}`);
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const tbody = document.getElementById(`tbody-${key}`);

    if (isUpdate) {
      const cacheIndex = cache[mod.sheet].findIndex(r => String(r[mod.idField]) === String(data.id));
      if (cacheIndex !== -1) {
        cache[mod.sheet][cacheIndex] = data;
      }
      const existingRow = tbody.querySelector(`tr[data-id="${data.id}"]`);
      if (existingRow) {
        const newRowHtml = renderSingleRow(key, data);
        existingRow.outerHTML = newRowHtml;
      } else {
        cache[mod.sheet] = await Api.list(mod.sheet);
        paintRows(key, searchInput ? searchInput.value : "");
      }
    } else {
      cache[mod.sheet].push(data);
      const rowString = JSON.stringify(data).toLowerCase();
      if (rowString.includes(searchTerm)) {
        const newRowHtml = renderSingleRow(key, data);
        tbody.insertAdjacentHTML('beforeend', newRowHtml);
      }
    }
        // ----- Add/Update කිරීමෙන් පසු Vehicles Cards Update කරන්න -----
    if (key === 'vehicles') {
      renderVehicleStatsCards();
    }

  } catch (err) {
    // ----- Error එකක් ආවොත් Button එක නැවත හරවන්න (Modal එක වසන්න එපා, userට නැවත try කරන්න දෙන්න) -----
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    alert("Couldn't save: " + err.message);
  }
});

async function removeRow(key, id) {
  const mod = MODULES[key]; // මෙය දැනටමත් තියෙනවා
  if (!confirm("Delete this record?")) return;
  try {
    await Api.remove(mod.sheet, id);

    // 1. Cache එකෙන් ඒ row එක remove කරන්න
    const cacheIndex = cache[mod.sheet].findIndex(r => String(r[mod.idField]) === String(id));
    if (cacheIndex !== -1) {
      cache[mod.sheet].splice(cacheIndex, 1);
    }

    // 2. DOM එකෙන් ඒ specific row එක remove කරන්න
    const tbody = document.getElementById(`tbody-${key}`);
    const rowToRemove = tbody.querySelector(`tr[data-id="${id}"]`);
    if (rowToRemove) {
      rowToRemove.remove();
    }
        // Delete කිරීමෙන් පසු Vehicles Cards Update කරන්න
    if (key === 'vehicles') {
      renderVehicleStatsCards();
    }

  } catch (err) {
    alert("Couldn't delete: " + err.message);
  }
}

// ===================================================================
// DASHBOARD
// ===================================================================
async function loadDashboard() {
  const gaugeRow = document.getElementById("gaugeRow");
  gaugeRow.innerHTML = `<div class="hint">Loading fleet summary…</div>`;
  try {
    const [vehicles, maintenance, fuel] = await Promise.all([
      Api.list("Vehicles"),
      Api.list("Maintenance"),
      Api.list("FuelLogs"),
    ]);
    cache.Vehicles = vehicles;
    cache.Maintenance = maintenance;
    cache.FuelLogs = fuel;

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
      vehicles
        .filter((v) => v.Status === status)
        .map((v) => [v["Vehicle No"], v.Type || "—"]);

    const typeCountsByStatus_ = (status) => {
      const counts = {};
      vehicles
        .filter((v) => v.Status === status)
        .forEach((v) => {
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

    initVehicleLookup_();
    loadFleetFuelChart_();
    loadExpiringPanels_();
    loadFleetTotalCostChart_();
  } catch (err) {
    gaugeRow.innerHTML = `<div class="hint">❌ Couldn't load summary — ${err.message}</div>`;
  }
}

// ===================================================================
// FLEET FUEL CHART
// ===================================================================
async function loadFleetFuelChart_() {
  try {
    const fuel = cache.FuelLogs || (await Api.list("FuelLogs"));
    cache.FuelLogs = fuel;

    const years = getAvailableYears_(fuel, []);
    const yearSelect = document.getElementById("fleetFuelYear");
    const defaultYear = years[0];
    yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

    const typeSelect = document.getElementById("fleetFuelType");
    const rerender = () => renderFleetFuelCombo_(Number(yearSelect.value), typeSelect.value);
    yearSelect.addEventListener("change", rerender);
    typeSelect.addEventListener("change", rerender);

    renderFleetFuelCombo_(defaultYear, "All");
  } catch (err) {
    document.getElementById("fleetFuelComboChart").innerHTML = `<p class="hint">Couldn't load fuel chart (${err.message})</p>`;
  }
}

function renderFleetFuelCombo_(year, fuelType) {
  const fuel = cache.FuelLogs || [];
  const costTotals = new Array(12).fill(0);

  if (fuelType === "All") {
    const dieselQty = new Array(12).fill(0);
    const petrolQty = new Array(12).fill(0);

    fuel.forEach((r) => {
      if (!r.Date) return;
      const dt = new Date(r.Date);
      if (dt.getFullYear() !== year) return;
      const m = dt.getMonth();
      costTotals[m] += Number(r.Cost) || 0;
      if (r.Fueltype === "Diesel") dieselQty[m] += Number(r.Liters) || 0;
      else if (r.Fueltype === "Petrol") petrolQty[m] += Number(r.Liters) || 0;
    });

    document.getElementById("fleetFuelComboChart").innerHTML =
      comboChartSvg_(dieselQty, costTotals, undefined, "fleetFuelComboSvg", petrolQty);
    attachComboHover_("fleetFuelComboSvg", dieselQty, costTotals);
    return;
  }

  const qtyTotals = new Array(12).fill(0);
  fuel.forEach((r) => {
    if (!r.Date) return;
    const dt = new Date(r.Date);
    if (dt.getFullYear() !== year || r.Fueltype !== fuelType) return;
    const m = dt.getMonth();
    qtyTotals[m] += Number(r.Liters) || 0;
    costTotals[m] += Number(r.Cost) || 0;
  });

  document.getElementById("fleetFuelComboChart").innerHTML = comboChartSvg_(qtyTotals, costTotals);
  attachComboHover_("fleetFuelComboSvg", qtyTotals, costTotals);
}

function comboChartGeometry_(qtyValues, costValues, qtyValues2) {
  const w = 700, h = 100, padL = 46, padR = 46, padT = 20, padB = 30;
  const allQty = qtyValues2 ? qtyValues.concat(qtyValues2) : qtyValues;
  const maxQty = Math.max(...allQty, 1) * 1.2;
  const maxCost = Math.max(...costValues, 1) * 1.2;
  const stepX = (w - padL - padR) / (qtyValues.length - 1);
  return {
    w, h, padT, padB,
    xFor: (i) => padL + stepX * i,
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

function comboChartSvg_(qtyValues, costValues, customLabels, svgId, qtyValues2) {
  const monthLabels = customLabels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const geo = comboChartGeometry_(qtyValues, costValues, qtyValues2);

  const bars = qtyValues2
    ? qtyValues
        .map((v, i) => {
          const gap = geo.barWidth * 0.15;
          const x1 = geo.xFor(i) - geo.barWidth - gap / 2;
          const x2 = geo.xFor(i) + gap / 2;
          const v2 = qtyValues2[i];
          const y1 = geo.yForQty(v);
          const h1 = Math.max((geo.h - geo.padB) - y1, 0);
          const y2 = geo.yForQty(v2);
          const h2 = Math.max((geo.h - geo.padB) - y2, 0);
          return `
            <rect class="combo-bar combo-bar-a" x="${x1}" y="${y1}" width="${geo.barWidth}" height="${h1}" rx="3"></rect>
            ${v > 0 ? `<text class="combo-bar-label" x="${x1 + geo.barWidth / 2}" y="${y1 - 6}" text-anchor="middle">${Math.round(v)} Ltr</text>` : ""}
            <rect class="combo-bar combo-bar-b" x="${x2}" y="${y2}" width="${geo.barWidth}" height="${h2}" rx="3"></rect>
            ${v2 > 0 ? `<text class="combo-bar-label" x="${x2 + geo.barWidth / 2}" y="${y2 - 6}" text-anchor="middle">${Math.round(v2)} Ltr</text>` : ""}
          `;
        })
        .join("")
    : qtyValues
        .map((v, i) => {
          const barY = geo.yForQty(v);
          const barH = Math.max((geo.h - geo.padB) - barY, 0);
          return `<rect class="combo-bar" x="${geo.xFor(i) - geo.barWidth / 2}" y="${barY}" width="${geo.barWidth}" height="${barH}" rx="3"></rect>
            ${v > 0 ? `<text class="combo-bar-label" x="${geo.xFor(i)}" y="${barY - 6}" text-anchor="middle">${Math.round(v)} Ltr</text>` : ""}`;
        })
        .join("");

  const linePoints = costValues.map((v, i) => ({ x: geo.xFor(i), y: geo.yForCost(v) }));
  const linePath = smoothLinePath_(linePoints);

  const axisLabels = monthLabels
    .map((m, i) => `<text class="combo-axis-label" x="${geo.xFor(i)}" y="${geo.h - 8}" text-anchor="middle">${m}</text>`)
    .join("");

  return `
    <svg class="combo-chart-svg" id="${svgId || 'fleetFuelComboSvg'}" viewBox="0 0 ${geo.w} ${geo.h}" xmlns="http://www.w3.org/2000/svg">
      ${bars}
      <path class="combo-line-path" d="${linePath}"></path>
      ${axisLabels}
      <circle id="${svgId || 'fleetFuelComboSvg'}-dot" class="combo-hover-dot" r="3"></circle>
      <rect id="${svgId || 'fleetFuelComboSvg'}-label-bg" class="combo-hover-label-bg"></rect>
      <text id="${svgId || 'fleetFuelComboSvg'}-label" class="combo-hover-label"></text>
    </svg>
    <div class="combo-legend">
      ${qtyValues2 ? `
        <span><span class="swatch" style="background:rgb(10, 10, 141)"></span>Diesel Qty (Ltr)</span>
        <span><span class="swatch" style="background:rgb(74, 186, 247)"></span>Petrol Qty (Ltr)</span>
        <span><span class="swatch" style="background:rgb(54, 119, 249)"></span>Total Cost (Rs.) — line, hover</span>
      ` : `
        <span><span class="swatch" style="background:rgb(10, 10, 141)"></span>Quantity (Ltr) — column</span>
        <span><span class="swatch" style="background:rgb(54, 119, 249)"></span>Cost (Rs.) — line, hover to see values</span>
      `}
    </div>
  `;
}

function attachComboHover_(svgId, qtyValues, costValues) {
  const svg = document.getElementById(svgId);
  const dot = document.getElementById(`${svgId}-dot`);
  const label = document.getElementById(`${svgId}-label`);
  const labelBg = document.getElementById(`${svgId}-label-bg`);
  if (!svg || !dot || !label || !labelBg) return;
  const geo = comboChartGeometry_(qtyValues, costValues);

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = geo.w / rect.width;
    const mouseXInSvg = (e.clientX - rect.left) * scaleX;
    let nearest = 0, minDist = Infinity;
    costValues.forEach((_, i) => {
      const dist = Math.abs(geo.xFor(i) - mouseXInSvg);
      if (dist < minDist) { minDist = dist;
        nearest = i; }
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

// ===================================================================
// VEHICLE LOOKUP
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
    // Dashboard already shows errors
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

  input.addEventListener("focus", () => {
    renderList_("");
    dropdown.classList.add("open");
  });
  input.addEventListener("click", () => {
    renderList_(input.value);
    dropdown.classList.add("open");
  });
  input.addEventListener("input", () => {
    renderList_(input.value);
    dropdown.classList.add("open");
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const match = vehicleNumbers.find((no) => no.toLowerCase() === input.value.toLowerCase()) ||
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
    const [vehicles, drivers, fuel, lubricant, service, repair, license, insurance, accidents] = await Promise.all([
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

    const years = getAvailableYears_([...fuelRows, ...lubeRows, ...serviceRows, ...repairRows], [...licenseRows, ...insuranceRows]);
    const defaultYear = years[0];

    resultsEl.innerHTML = `
      <div class="panel" style="margin-bottom:16px;">
        <div class="chart-toolbar">
          <h2 style="font-size:16px;">Monthly Total Cost Trend</h2>
          <select id="costChartYear">
            ${years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("")}
          </select>
        </div>
        <div class="panel-body" id="costChartContainer"></div>
      </div>

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

      <div class="panel" style="margin-bottom:16px;">
        <div class="chart-toolbar">
          <h2 style="font-size:16px;">Fuel History (${fuelRows.length})</h2>
          <div style="display:flex; gap:8px;">
            <select id="vehicleFuelYear"></select>
            <select id="vehicleFuelMonth"></select>
          </div>
        </div>
        <div class="panel-body" id="vehicleFuelComboChart">Loading…</div>
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
    document.getElementById("costChartYear").addEventListener("change", (e) => {
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
      const display = isCost && v !== undefined && v !== "" ? formatNumber_(v) : (v ?? "—");
      return `<div class="info-row"><span>${k}</span><span>${display}</span></div>`;
    }).join("")}
  </div>`;
}

function miniTable_(rows, columns) {
  if (!rows.length) return `<p class="hint">No records.</p>`;
  return `<table><thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr>${columns
          .map((c) => {
            const isCost = /cost/i.test(c);
            const val = r[c];
            const display = isCost && val !== undefined && val !== "" ? formatNumber_(val) : (val ?? "");
            return `<td>${display}</td>`;
          })
          .join("")}</tr>`
      )
      .join("")}</tbody></table>`;
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

// ===================================================================
// LIVE TRACKING
// ===================================================================
let map, markersLayer;

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

document.getElementById("pushLocationBtn").addEventListener("click", () => {
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
// MAINTENANCE & LICENSE/INSURANCE SUBTABS
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
// HELPER FUNCTIONS
// ===================================================================
let currentVehicleLookup_ = null;

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

  document.getElementById("costChartContainer").innerHTML = lineChartSvg_(monthTotals, undefined, undefined, true);
}

function lineChartSvg_(values, color, svgId, showLabelBg, labelFontSize, counts) {
  const fontSize = labelFontSize || 9.5;
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = 640, h = 100, padL = 30, padR = 30, padT = 16, padB = 28;
  const gradId = (svgId || "lineChart") + "-gradient";
  const chartColor = color || "var(--steel)";
  const max = Math.max(...values, 1) * 1.15;
  const stepX = (w - padL - padR) / (values.length - 1);
  const yFor = (v) => padT + (h - padT - padB) * (1 - v / max);
  const xFor = (i) => padL + stepX * i;

  const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
  const areaPoints = `${padL},${yFor(0)} ${points} ${xFor(values.length - 1)},${yFor(0)}`;

  const dots = values
    .map(
      (v, i) => {
        const countText = counts ? ` (${counts[i]} record${counts[i] === 1 ? "" : "s"})` : "";
        return `<circle class="line-chart-dot" cx="${xFor(i)}" cy="${yFor(v)}" r="3.5">
          <title>${monthLabels[i]}: ${formatNumber_(v)}${countText}</title>
        </circle>
        ${v > 0 ? `<text class="line-chart-value-label" x="${xFor(i)}" y="${yFor(v) - 8}" text-anchor="middle" style="font-size:${fontSize}px">Rs.${Math.round(v).toLocaleString("en-US")}</text>` : ""}`;
      }
    )
    .join("");

  const axisLabels = monthLabels
    .map((m, i) => `<text class="line-chart-axis-label" x="${xFor(i)}" y="${h - 8}" text-anchor="middle">${m}</text>`)
    .join("");

  return `<svg class="line-chart-svg" style="--chart-line-color:${chartColor}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style="stop-color:${chartColor}"/>
        <stop offset="100%" style="stop-color:${chartColor}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon class="line-chart-area" fill="url(#${gradId})" points="${areaPoints}"></polygon>
    <polyline class="line-chart-path" points="${points}"></polyline>
    ${dots}
    ${axisLabels}
  </svg>`;
}

function setupVehicleFuelFilters_(fuelRows) {
  const years = getAvailableYears_(fuelRows, []);
  const yearSelect = document.getElementById("vehicleFuelYear");
  const monthSelect = document.getElementById("vehicleFuelMonth");
  const defaultYear = years[0];

  yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthSelect.innerHTML =
    `<option value="All" selected>All (Monthly view)</option>` +
    monthNames.map((m, i) => `<option value="${i}">${m}</option>`).join("");

  const rerender = () => renderVehicleFuelChart_(fuelRows, Number(yearSelect.value), monthSelect.value);
  yearSelect.addEventListener("change", rerender);
  monthSelect.addEventListener("change", rerender);

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
    container.innerHTML = comboChartSvg_(qtyTotals, costTotals, undefined, "vehicleFuelComboSvg");
    attachComboHover_("vehicleFuelComboSvg", qtyTotals, costTotals);
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

  container.innerHTML = comboChartSvg_(qtyTotals, costTotals, dayLabels, "vehicleFuelComboSvg");
  attachComboHover_("vehicleFuelComboSvg", qtyTotals, costTotals);
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
    yearSelect.addEventListener("change", render);
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
// LICENSE / INSURANCE EXPIRING SOON
// ===================================================================
async function loadExpiringPanels_() {
  try {
    const [vehicles, license, insurance] = await Promise.all([
      cache.Vehicles || Api.list("Vehicles"),
      Api.list("License"),
      Api.list("Insurance"),
    ]);
    cache.Vehicles = vehicles;

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
    .filter((r) => r.daysLeft >= 0 && r.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const container = document.getElementById(containerId);
  if (!withDaysLeft.length) {
    container.innerHTML = `<p class="hint">No vehicles expiring within 7 days.</p>`;
    return;
  }

  const rowsHtml = withDaysLeft
    .map((r) => {
      const v = vehicles.find((veh) => veh["Vehicle No"] === r.VehicleID) || {};
      const daysClass = r.daysLeft <= 3 ? "expiry-urgent" : "";
      return `<tr>
        <td>${r.VehicleID || ""}</td>
        <td class="${daysClass}">${r.daysLeft}</td>
        <td>${r.ToDate || ""}</td>
        <td>${v.Department || ""}</td>
        <td>${v.User || ""}</td>
      </tr>`;
    })
    .join("");

  container.innerHTML = `<table>
    <thead><tr>
      <th>Vehicle No</th><th>Days Left</th><th>Expiry Date</th><th>Department</th><th>User Name</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>`;
}

// 🔹 FIX: Vehicle Image
function updateVehicleImage_(vehicleNo) {
  const img = document.getElementById("vehicleLookupImage");
  if (!img) return;

  const safeName = vehicleNo.replace(/[^a-zA-Z0-9]/g, "");

  const tryImage = (ext) => {
    img.src = `images/vehicles/${safeName}.${ext}`;
  };

  img.onerror = function() {
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

  img.onload = function() {
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
// FLEET TOTAL COST CHART
// ===================================================================
let fleetCostData_ = null;

async function loadFleetTotalCostChart_() {
  try {
    const [fuel, lubricant, service, repair, license, insurance, vehicles] = await Promise.all([
      cache.FuelLogs || Api.list("FuelLogs"),
      Api.list("Lubricant"),
      Api.list("Maintenance"),
      Api.list("Repair"),
      Api.list("License"),
      Api.list("Insurance"),
      cache.Vehicles || Api.list("Vehicles"),
    ]);
    cache.FuelLogs = fuel;
    cache.Vehicles = vehicles;

    fleetCostData_ = { fuel, lubricant, service, repair, license, insurance, vehicles };

    const years = getAvailableYears_(
      [...fuel, ...lubricant, ...service, ...repair],
      [...license, ...insurance]
    );
    const yearSelect = document.getElementById("fleetCostChartYear");
    const defaultYear = years[0];
    yearSelect.innerHTML = years.map((y) => `<option value="${y}" ${y === defaultYear ? "selected" : ""}>${y}</option>`).join("");

    yearSelect.addEventListener("change", (e) => {
      const y = Number(e.target.value);
      renderFleetTotalCostChart_(y);
      setupTopVehiclesMonthFilter_(y);
    });
    renderFleetTotalCostChart_(defaultYear);
    setupTopVehiclesMonthFilter_(defaultYear);
  } catch (err) {
    document.getElementById("fleetCostChartContainer").innerHTML = `<p class="hint">Couldn't load chart (${err.message})</p>`;
  }
}

function renderFleetTotalCostChart_(year) {
  const d = fleetCostData_;
  if (!d) return;
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

  document.getElementById("fleetCostChartContainer").innerHTML = lineChartSvg_(monthTotals, undefined, "fleetCostSvg", true);
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

  const vehicleTotals = {};
  const addByDate = (rows, dateKey) => {
    rows.forEach((r) => {
      if (!r[dateKey] || !r.VehicleID) return;
      const dt = new Date(r[dateKey]);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        vehicleTotals[r.VehicleID] = (vehicleTotals[r.VehicleID] || 0) + (Number(r.Cost) || 0);
      }
    });
  };
  addByDate(d.fuel, "Date");
  addByDate(d.lubricant, "Date");
  addByDate(d.service, "Date");
  addByDate(d.repair, "Date");
  addByDate(d.license, "FromDate");
  addByDate(d.insurance, "FromDate");

  const top10 = Object.entries(vehicleTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!top10.length) {
    container.innerHTML = `<p class="hint">No cost records for this month.</p>`;
    return;
  }

  container.innerHTML = top10
    .map(([vNo, cost], i) => {
      const vehicleInfo = d.vehicles.find((v) => v["Vehicle No"] === vNo);
      const department = vehicleInfo ? (vehicleInfo.Department || "—") : "—";
      return `<div class="top-vehicle-row">
        <span><span class="top-vehicle-rank">${i + 1}</span><span class="top-vehicle-name">${vNo}</span></span>
        <span class="top-vehicle-dept">${department}</span>
        <span class="top-vehicle-cost">${formatNumber_(cost)}</span>
      </div>`;
    })
    .join("");
}

// ===================================================================
// CHART ZOOM
// ===================================================================
const chartZoomLevels_ = {};

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
// API STATUS + INIT
// ===================================================================
function todayISO_() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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