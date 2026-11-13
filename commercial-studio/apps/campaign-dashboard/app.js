const required = ["date", "platform", "content_id", "format", "topic", "impressions", "reach", "views", "likes", "comments", "shares", "saves", "profile_visits", "link_clicks", "leads", "messages_sent", "replies", "meetings", "paid_clients", "spend", "notes"];
const example = [
  {date:"2026-10-02",platform:"Instagram",content_id:"DEMO-01",format:"Reel",topic:"Menu clarity",impressions:1840,reach:1320,views:960,likes:84,comments:9,shares:18,saves:22,profile_visits:61,link_clicks:34,leads:5,messages_sent:4,replies:2,meetings:1,paid_clients:0,spend:0,notes:"Fictional example"},
  {date:"2026-10-07",platform:"TikTok",content_id:"DEMO-02",format:"Short",topic:"Cafe website",impressions:4260,reach:3810,views:3190,likes:213,comments:17,shares:41,saves:28,profile_visits:77,link_clicks:39,leads:4,messages_sent:3,replies:2,meetings:1,paid_clients:1,spend:0,notes:"Fictional example"},
  {date:"2026-10-14",platform:"Facebook",content_id:"DEMO-03",format:"Post",topic:"Mobile menu",impressions:970,reach:805,views:510,likes:32,comments:8,shares:11,saves:5,profile_visits:29,link_clicks:18,leads:3,messages_sent:2,replies:1,meetings:0,paid_clients:0,spend:0,notes:"Fictional example"}
];
let records = example.slice();
const numberFields = required.slice(5, 20);
const $ = function (id) { return document.getElementById(id); };
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(function (value) { return value.replace(/^\uFEFF/, "").trim(); });
  if (!required.every(function (key) { return headers.includes(key); })) throw new Error("This file is missing one or more template columns. Download the template and keep its header row.");
  return rows.filter(function (cells) { return cells.some(function (value) { return value.trim(); }); }).map(function (cells) {
    const record = {};
    headers.forEach(function (key, index) { record[key] = cells[index] == null ? "" : cells[index].trim(); });
    numberFields.forEach(function (key) { record[key] = record[key] === "" ? 0 : Number(record[key]); if (!Number.isFinite(record[key]) || record[key] < 0) throw new Error("Check the non-negative number in column: " + key); });
    return record;
  });
}
function sum(key) { return records.reduce(function (total, record) { return total + (Number(record[key]) || 0); }, 0); }
function rate(numerator, denominator) { return denominator ? (numerator / denominator * 100).toFixed(1) + "%" : "—"; }
function pretty(value) { return Number(value).toLocaleString("en-US"); }
function render() {
  const impressions = sum("impressions"), clicks = sum("link_clicks"), leads = sum("leads"), meetings = sum("meetings"), paid = sum("paid_clients");
  $("total-impressions").textContent = pretty(impressions);
  $("total-clicks").textContent = pretty(clicks);
  $("total-leads").textContent = pretty(leads);
  $("total-paid").textContent = pretty(paid);
  $("ctr").textContent = "CTR " + rate(clicks, impressions);
  $("lead-rate").textContent = "Click-to-lead " + rate(leads, clicks);
  $("close-rate").textContent = "Meeting close " + rate(paid, meetings);
  $("record-count").textContent = records.length + (records.length === 1 ? " record" : " records");
  const platforms = {};
  records.forEach(function (record) { const key = String(record.platform || "Unspecified"); platforms[key] = (platforms[key] || 0) + Number(record.link_clicks || 0); });
  const entries = Object.entries(platforms).sort(function (a, b) { return b[1] - a[1]; });
  const max = Math.max(1, ...entries.map(function (entry) { return entry[1]; }));
  $("platform-chart").innerHTML = entries.map(function (entry) {
    const share = clicks ? Math.round(entry[1] / clicks * 100) : 0;
    return '<div class="bar-item"><div class="bar-top"><span>' + escapeHtml(entry[0]) + '</span><strong>' + pretty(entry[1]) + ' clicks</strong></div><div class="track"><div class="fill" style="width:' + Math.round(entry[1] / max * 100) + '%"></div></div><p class="bar-note">' + share + '% of tracked clicks</p></div>';
  }).join("");
  $("chart-empty").hidden = records.length > 0;
  $("platform-chart").hidden = records.length === 0;
  $("campaign-rows").innerHTML = records.map(function (record) {
    return "<tr><td>" + escapeHtml(record.date || "—") + "</td><td>" + escapeHtml(record.platform || "—") + "</td><td>" + escapeHtml(record.format || "—") + "</td><td>" + escapeHtml(record.topic || "—") + "</td><td>" + pretty(record.reach) + "</td><td>" + pretty(record.link_clicks) + "</td><td>" + pretty(record.leads) + "</td><td>" + pretty(record.spend) + "</td></tr>";
  }).join("");
  $("table-empty").hidden = records.length > 0;
}
function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; }); }
$("csv-file").addEventListener("change", async function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try { records = parseCsv(await file.text()); render(); $("status").textContent = "Loaded " + records.length + " rows from " + file.name + ". The file stayed in this browser."; }
  catch (error) { $("status").textContent = error.message; }
  event.target.value = "";
});
$("load-sample").addEventListener("click", function () { records = example.slice(); render(); $("status").textContent = "Fictional example data is ready to explore."; });
$("clear-data").addEventListener("click", function () { records = []; render(); $("status").textContent = "View cleared. No file was saved or uploaded."; });
render();

