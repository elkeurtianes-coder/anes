const STORAGE_KEY = "signal-room-library-v1";
const form = document.querySelector("#brief-form");
const outputEmpty = document.querySelector("#output-empty");
const output = document.querySelector("#output");
const resultBody = document.querySelector("#result-body");
const resultMeta = document.querySelector("#result-meta");
const liveMessage = document.querySelector("#live-message");
let activePack = null;
let noticeTimer = 0;

const sampleBrief = {
  brand: "North Pier Coffee",
  product: "Iced cardamom oat latte",
  audience: "People stepping out for a short afternoon reset",
  platform: "Instagram Reels",
  tone: "Warm and observant",
  offer: "See the menu and visit this week",
  sourceNotes: "Hook: close-up sound before the first spoken line\nFormat: one creator at a cafe counter\nPacing: quick opening, then a slower product detail\nCTA: invite viewers to see the menu"
};

const concepts = [
  {
    title: "The small pause",
    framing: "A tiny break in a busy day",
    hook: (product) => `“I needed a minute, so I went looking for ${product}.”`,
    beat: "Open on the moment before the choice. Let the product appear as part of the routine, not a miraculous fix."
  },
  {
    title: "Look closer",
    framing: "A tactile, detail-first product moment",
    hook: (product) => `“Here’s the detail I wanted to see before trying ${product}.”`,
    beat: "Show a real preparation, texture, packaging, or service detail. Use only a detail the brand can verify."
  },
  {
    title: "The honest shortlist",
    framing: "A creator explains what to check before choosing",
    hook: (product) => `“Choosing ${product}? Here are the two things I’d check first.”`,
    beat: "Name two useful decision points, then show where this offer fits. Present a creator concept, not a fabricated customer testimonial."
  }
];

function readLibrary() {
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLibrary(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 8)));
    return true;
  } catch {
    announce("This browser could not save the brief. Export the pack to keep a copy.");
    return false;
  }
}

function value(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function readBrief() {
  return {
    brand: value("brand"),
    product: value("product"),
    audience: value("audience"),
    platform: value("platform"),
    tone: value("tone"),
    offer: value("offer") || "Learn more",
    sourceNotes: value("source-notes")
  };
}

function labelledNotes(text) {
  const labels = ["Hook", "Format", "Pacing", "Offer", "CTA", "Visual", "Sound"];
  const found = Object.fromEntries(labels.map((label) => [label, "Not supplied — add your own observation."]));
  text.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*(hook|format|pacing|offer|cta|visual|sound)\s*:\s*(.+)$/i);
    if (match) found[labels.find((label) => label.toLowerCase() === match[1].toLowerCase())] = match[2].trim();
  });
  if (!text.trim()) found.Hook = "No reference notes entered. Start with a first-second pattern you noticed.";
  return found;
}

function buildPack(brief) {
  const angles = concepts.map((concept, index) => ({
    ...concept,
    number: String(index + 1).padStart(2, "0"),
    hookLine: concept.hook(brief.product)
  }));
  const script = [
    { time: "0–3 sec", label: "Hook", text: angles[0].hookLine },
    { time: "3–8 sec", label: "Context", text: `Set the scene for ${brief.audience}. Keep the moment specific and easy to recognize.` },
    { time: "8–17 sec", label: "Show", text: `Show ${brief.product} in a real use moment. Capture an authentic detail; do not add features or results that were not supplied.` },
    { time: "17–24 sec", label: "Proof", text: "Insert one verified brand detail here: an ingredient, service fact, material, process, or other proof point. Leave it out if it cannot be checked." },
    { time: "24–30 sec", label: "Next step", text: `${brief.offer}. End on a clean product or location shot.` }
  ];
  const promptScenes = [
    "Opening macro: hands prepare the product in one natural motion; tactile surface, clean composition, no text overlay.",
    "First-person arrival: camera moves from the surrounding real-world setting toward the product; relaxed handheld movement.",
    "Three-beat montage: preparation, close detail, finished product; use natural light and believable materials.",
    "Quiet product portrait: a still moment with one subtle camera push-in; composed for readable space above and below.",
    "Closing scene: product beside a meaningful setting detail; gentle movement, strong final frame for an on-screen call to action."
  ];
  const prompts = promptScenes.map((scene) => `Create an original 9:16 vertical ${brief.platform} video scene for ${brief.brand}, featuring ${brief.product}. Audience: ${brief.audience}. Visual direction: ${scene} Voice: ${brief.tone}. Do not imitate the reference ad, use existing brand marks, depict a real person or celebrity, or include copyrighted characters or music. Keep product details faithful to the supplied brief.`);
  const notes = labelledNotes(brief.sourceNotes);
  const caption = `${brief.product}, in a moment that fits your day. ${brief.offer}. #${slugTag(brief.brand)} #${slugTag(brief.product)} #${slugTag(brief.platform)}`;
  return {
    id: globalThis.crypto?.randomUUID?.() || `pack-${Date.now()}`,
    createdAt: new Date().toISOString(),
    brief,
    notes,
    angles,
    script,
    prompts,
    caption
  };
}

function slugTag(text) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "").slice(0, 24) || "creative";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderPack(pack) {
  activePack = pack;
  outputEmpty.hidden = true;
  output.hidden = false;
  const when = new Date(pack.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  resultMeta.textContent = `${pack.brief.brand} · ${pack.brief.platform} · ${when}`;
  const noteOrder = ["Hook", "Format", "Pacing", "Offer", "CTA", "Visual", "Sound"];
  const signalHtml = noteOrder.map((label) => `<div class="signal-item"><p><strong>${escapeHtml(label)}</strong>${escapeHtml(pack.notes[label])}</p></div>`).join("");
  const angleHtml = pack.angles.map((angle) => `<article class="angle"><span class="angle-index">${angle.number}</span><div><h4>${escapeHtml(angle.title)} <span class="label-note">· ${escapeHtml(angle.framing)}</span></h4><p><strong>${escapeHtml(angle.hookLine)}</strong><br>${escapeHtml(angle.beat)}</p></div></article>`).join("");
  const scriptHtml = pack.script.map((line) => `<div class="script-line"><span class="script-time">${escapeHtml(line.time)}<br>${escapeHtml(line.label)}</span><p>${escapeHtml(line.text)}</p></div>`).join("");
  const promptsHtml = pack.prompts.map((prompt) => `<div class="prompt-item">${escapeHtml(prompt)}</div>`).join("");
  resultBody.innerHTML = `
    <section class="result-section"><p class="result-label">Reference signals</p><h3>What to learn from the pattern</h3><div class="signal-list">${signalHtml}</div><p class="claim-note">Only labeled notes are extracted. The reference itself is never fetched or reproduced.</p></section>
    <section class="result-section"><p class="result-label">Original directions</p><h3>Three ways in</h3><div class="angle-list">${angleHtml}</div></section>
    <section class="result-section"><p class="result-label">Shoot plan · 30 seconds</p><h3>One draft script</h3><div class="script-sheet">${scriptHtml}</div><p class="claim-note">Before filming, replace the proof placeholder with a verified fact or remove it.</p></section>
    <section class="result-section"><p class="result-label">Video generation prompts</p><h3>Five original scenes</h3><div class="prompt-list">${promptsHtml}</div><p class="claim-note">These are text prompts. A separate video service is needed to render them.</p></section>
    <section class="result-section"><p class="result-label">Caption draft</p><h3>Ready to adapt</h3><div class="caption-box"><p>${escapeHtml(pack.caption)}</p></div><p class="claim-note">Check every claim, hashtag, offer, and platform rule before posting.</p></section>`;
}

function renderLibrary() {
  const list = document.querySelector("#library-list");
  const packs = readLibrary();
  list.replaceChildren();
  if (!packs.length) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = "Your saved creative sets will appear here.";
    list.append(empty);
    return;
  }
  packs.forEach((pack) => {
    const entry = document.createElement("div");
    entry.className = "library-entry";
    const load = document.createElement("button");
    load.className = "library-load";
    load.type = "button";
    load.innerHTML = `<strong>${escapeHtml(pack.brief.brand)} · ${escapeHtml(pack.brief.product)}</strong><span>${escapeHtml(pack.brief.platform)} · ${new Date(pack.createdAt).toLocaleDateString()}</span>`;
    load.addEventListener("click", () => {
      renderPack(pack);
      document.querySelector("#output-title").scrollIntoView({ behavior: "smooth", block: "start" });
      announce("Creative set opened.");
    });
    const remove = document.createElement("button");
    remove.className = "library-delete";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove saved brief for ${pack.brief.brand}`);
    remove.addEventListener("click", () => {
      writeLibrary(readLibrary().filter((row) => row.id !== pack.id));
      renderLibrary();
      announce("Saved brief removed from this browser.");
    });
    entry.append(load, remove);
    list.append(entry);
  });
}

function packAsMarkdown(pack) {
  const lines = [
    `# Creative pack — ${pack.brief.brand}`,
    `Created: ${new Date(pack.createdAt).toLocaleString()}`,
    "",
    `**Product:** ${pack.brief.product}`,
    `**Audience:** ${pack.brief.audience}`,
    `**Channel:** ${pack.brief.platform}`,
    `**Voice:** ${pack.brief.tone}`,
    `**Next step:** ${pack.brief.offer}`,
    "",
    "## Reference signals (notes supplied by user)",
    ...Object.entries(pack.notes).map(([key, value]) => `- **${key}:** ${value}`),
    "",
    "## Original angles",
    ...pack.angles.flatMap((angle) => [`### ${angle.title}`, `**Hook:** ${angle.hookLine}`, angle.beat, ""]),
    "## Script draft",
    ...pack.script.map((line) => `- **${line.time} · ${line.label}:** ${line.text}`),
    "",
    "## Five video prompts",
    ...pack.prompts.map((prompt, index) => `${index + 1}. ${prompt}`),
    "",
    "## Caption draft",
    pack.caption,
    "",
    "Review factual claims, usage rights, platform requirements, and accessibility before publishing."
  ];
  return lines.join("\n");
}

function downloadText(filename, text) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function announce(message) {
  window.clearTimeout(noticeTimer);
  liveMessage.textContent = message;
  liveMessage.classList.add("is-visible");
  noticeTimer = window.setTimeout(() => liveMessage.classList.remove("is-visible"), 2800);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const pack = buildPack(readBrief());
  renderPack(pack);
  const library = [pack, ...readLibrary().filter((row) => row.id !== pack.id)].slice(0, 8);
  writeLibrary(library);
  renderLibrary();
  announce("Creative set built and saved in this browser.");
});

document.querySelector("#sample-button").addEventListener("click", () => {
  Object.entries(sampleBrief).forEach(([key, value]) => {
    document.querySelector(`#${key === "sourceNotes" ? "source-notes" : key}`).value = value;
  });
  announce("Sample cafe brief loaded. Edit any field before building.");
});

document.querySelector("#copy-button").addEventListener("click", async () => {
  if (!activePack) return;
  try {
    await navigator.clipboard.writeText(packAsMarkdown(activePack));
    announce("Creative pack copied.");
  } catch {
    announce("Clipboard access is unavailable. Use Export .md instead.");
  }
});

document.querySelector("#export-button").addEventListener("click", () => {
  if (!activePack) return;
  const filename = `${slugTag(activePack.brief.brand).toLowerCase()}-creative-pack.md`;
  downloadText(filename, packAsMarkdown(activePack));
  announce("Markdown pack downloaded.");
});

renderLibrary();

