const STORAGE_KEY = "commercial-studio-prospects-v1";
const stages = [
  { id: "new", label: "New" },
  { id: "researching", label: "Researching" },
  { id: "draft_ready", label: "Draft ready" },
  { id: "approved", label: "Approved" },
  { id: "contacted", label: "Contacted" },
  { id: "replied", label: "Replied" },
  { id: "won", label: "Won" },
  { id: "closed", label: "Closed" }
];
const form = document.getElementById("lead-form");
const rows = document.getElementById("prospect-rows");
const emptyState = document.getElementById("empty-state");
const notice = document.getElementById("notice");
const search = document.getElementById("search");
const importFile = document.getElementById("import-file");

function readLeads() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}
let leads = readLeads();

function safeText(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}
function validPublicUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (error) {
    return false;
  }
}
function saveLeads() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    notice.textContent = "Saved in this browser.";
  } catch (error) {
    notice.textContent = "This browser could not save. Export a CSV before closing.";
  }
}
function stageOptions(current) {
  return stages.map(function (stage) {
    return '<option value="' + stage.id + '"' + (stage.id === current ? " selected" : "") + ">" + stage.label + "</option>";
  }).join("");
}
function updateMetrics() {
  document.getElementById("metric-total").textContent = leads.length;
  document.getElementById("metric-drafts").textContent = leads.filter(function (lead) { return lead.stage === "draft_ready"; }).length;
  document.getElementById("metric-contacted").textContent = leads.filter(function (lead) { return lead.stage === "contacted" || lead.stage === "replied"; }).length;
  document.getElementById("metric-won").textContent = leads.filter(function (lead) { return lead.stage === "won"; }).length;
}
function updateChart() {
  const chart = document.getElementById("stage-chart");
  const counts = stages.map(function (stage) {
    return { label: stage.label, count: leads.filter(function (lead) { return lead.stage === stage.id; }).length };
  }).filter(function (stage) { return stage.count > 0 || leads.length === 0; });
  chart.innerHTML = counts.map(function (stage) {
    const width = leads.length ? Math.round(stage.count / leads.length * 100) : 0;
    return '<div class="stage-row"><span>' + safeText(stage.label) + '</span><div class="bar-track"><div class="bar" style="width:' + width + '%"></div></div><output>' + stage.count + "</output></div>";
  }).join("");
}
function render() {
  const query = search.value.trim().toLowerCase();
  const visible = leads.filter(function (lead) {
    const text = [lead.businessName, lead.businessType, lead.location, lead.notes].join(" ").toLowerCase();
    return text.includes(query);
  });
  rows.innerHTML = visible.map(function (lead) {
    const source = validPublicUrl(lead.sourceUrl)
      ? '<a href="' + safeText(lead.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open source</a>'
      : '<span class="muted">Not added</span>';
    return '<tr data-id="' + safeText(lead.id) + '">' +
      '<td><strong>' + safeText(lead.businessName) + '</strong><small>' + safeText(lead.businessType || "Business type not set") + '</small></td>' +
      '<td>' + safeText(lead.location || "—") + '</td>' +
      '<td>' + source + '</td>' +
      '<td><label class="visually-hidden" for="stage-' + safeText(lead.id) + '">Stage for ' + safeText(lead.businessName) + '</label><select id="stage-' + safeText(lead.id) + '" data-stage>' + stageOptions(lead.stage) + '</select></td>' +
      '<td><small>' + safeText(lead.notes || "Add a verified observation or next step.") + '</small></td>' +
      '<td><button class="remove" type="button" data-remove>Remove</button></td>' +
      '</tr>';
  }).join("");
  emptyState.hidden = visible.length > 0;
  updateMetrics();
  updateChart();
}
function newId() {
  return window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}
function parseCsv(text) {
  const matrix = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { cell += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(cell); matrix.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("This CSV has an unclosed quoted field.");
  if (cell.length || row.length) { row.push(cell); matrix.push(row); }
  const headers = (matrix.shift() || []).map(function (header) { return header.replace(/^\uFEFF/, "").trim(); });
  const required = ["businessName", "businessType", "location", "sourceUrl", "stage", "notes"];
  if (!required.every(function (header) { return headers.includes(header); })) {
    throw new Error("CSV must include businessName, businessType, location, sourceUrl, stage, and notes columns.");
  }
  const column = function (record, name) { return String(record[name] == null ? "" : record[name]).trim(); };
  return matrix.filter(function (cells) { return cells.some(function (value) { return String(value).trim(); }); }).map(function (cells) {
    const record = {};
    headers.forEach(function (header, index) { record[header] = cells[index] == null ? "" : cells[index]; });
    const businessName = column(record, "businessName");
    if (!businessName) return null;
    const stageValue = column(record, "stage");
    const stage = stages.some(function (item) { return item.id === stageValue; }) ? stageValue : "new";
    return {
      id: newId(),
      businessName: businessName,
      businessType: column(record, "businessType"),
      location: column(record, "location"),
      sourceUrl: column(record, "sourceUrl"),
      stage: stage,
      notes: column(record, "notes"),
      createdAt: new Date().toISOString()
    };
  }).filter(Boolean);
}
function leadKey(lead) {
  return [lead.businessName, lead.location].map(function (value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }).join("|");
}
importFile.addEventListener("change", async function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const importedRows = parseCsv(await file.text());
    const known = new Set(leads.map(leadKey));
    let imported = 0, duplicates = 0;
    const additions = [];
    importedRows.forEach(function (lead) {
      const key = leadKey(lead);
      if (known.has(key)) { duplicates++; return; }
      known.add(key);
      additions.push(lead);
      imported++;
    });
    leads = additions.concat(leads);
    saveLeads();
    render();
    notice.textContent = imported + " imported; " + duplicates + " duplicate" + (duplicates === 1 ? " skipped." : "s skipped.");
  } catch (error) {
    notice.textContent = error.message || "Could not read this CSV.";
  }
  event.target.value = "";
});
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const data = new FormData(form);
  const businessName = String(data.get("businessName") || "").trim();
  if (!businessName) return;
  leads.unshift({
    id: newId(),
    businessName: businessName,
    businessType: String(data.get("businessType") || "").trim(),
    location: String(data.get("location") || "").trim(),
    sourceUrl: String(data.get("sourceUrl") || "").trim(),
    stage: String(data.get("stage") || "new"),
    notes: String(data.get("notes") || "").trim(),
    createdAt: new Date().toISOString()
  });
  saveLeads();
  form.reset();
  render();
});
search.addEventListener("input", render);
rows.addEventListener("change", function (event) {
  if (!event.target.matches("[data-stage]")) return;
  const row = event.target.closest("tr");
  const lead = leads.find(function (item) { return item.id === row.dataset.id; });
  if (!lead) return;
  lead.stage = event.target.value;
  saveLeads();
  render();
});
rows.addEventListener("click", function (event) {
  if (!event.target.matches("[data-remove]")) return;
  const row = event.target.closest("tr");
  const lead = leads.find(function (item) { return item.id === row.dataset.id; });
  if (!lead || !window.confirm("Remove " + lead.businessName + " from this browser?")) return;
  leads = leads.filter(function (item) { return item.id !== lead.id; });
  saveLeads();
  render();
});
document.getElementById("export").addEventListener("click", function () {
  const columns = ["businessName", "businessType", "location", "sourceUrl", "stage", "notes", "createdAt"];
  function csv(value) { return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"'; }
  const content = [columns.join(","), ...leads.map(function (lead) {
    return columns.map(function (column) { return csv(lead[column]); }).join(",");
  })].join("
");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = "fieldnote-prospects.csv";
  link.click();
  window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
  notice.textContent = "CSV exported.";
});
render();

