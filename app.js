(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const form = $("#sendForm"), input = $("#contentInput"), inputLabel = $("#inputLabel");
  const filePicker = $("#filePicker"), fileInput = $("#fileInput"), selectedFiles = $("#selectedFiles");
  const dropList = $("#dropList"), emptyState = $("#emptyState"), toast = $("#toast");
  let activeType = "text", selected = [], toastTimer;
  const STORAGE_KEY = "leondrop-drops-v1";
  let drops = loadDrops();

  function loadDrops() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  }
  function saveDrops() {
    // Files are intentionally not persisted as blobs in localStorage.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(drops.map(({fileData, ...drop}) => drop))); } catch {}
  }
  function notify(message) {
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function safeLink(value) {
    try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : null; } catch { return null; }
  }
  function timeLabel(timestamp) {
    return new Intl.DateTimeFormat("de-DE", {hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short"}).format(new Date(timestamp));
  }
  function setType(type) {
    activeType = type;
    $$(".type-tab").forEach(btn => {
      const active = btn.dataset.type === type;
      btn.classList.toggle("active", active); btn.setAttribute("aria-selected", String(active));
    });
    input.classList.toggle("hidden", type === "file");
    filePicker.classList.toggle("hidden", type !== "file");
    inputLabel.classList.toggle("hidden", type === "file");
    if (type === "text") { inputLabel.textContent = "Dein Text"; input.placeholder = "Text hier einfügen oder tippen…"; }
    if (type === "link") { inputLabel.textContent = "Der Link"; input.placeholder = "https://…"; }
    $("#inputHint").textContent = type === "file" ? "Du kannst mehrere Dateien gleichzeitig auswählen." : "Tipp: Strg + Enter zum schnellen Senden";
    if (type !== "file") input.focus();
  }
  function addDrop(drop) {
    drops.unshift(drop); saveDrops(); render(); notify("Gesendet — in diesem Browser gespeichert.");
  }
  function render() {
    dropList.innerHTML = "";
    emptyState.classList.toggle("hidden", drops.length > 0);
    $("#copyLatest").disabled = !drops.some(d => d.type === "text" || d.type === "link");
    drops.forEach(drop => {
      const item = document.createElement("article"); item.className = "drop-item";
      const icon = drop.type === "link" ? "↗" : drop.type === "file" ? "▧" : "✎";
      let content = "";
      if (drop.type === "link") {
        const url = safeLink(drop.content);
        content = url ? `<div class="drop-content"><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(drop.content)}</a></div>` : `<div class="drop-content">${escapeHTML(drop.content)}</div>`;
      } else if (drop.type === "text") {
        content = `<div class="drop-content">${escapeHTML(drop.content)}</div>`;
      } else {
        content = `<div class="drop-file">${drop.isImage && drop.preview ? `<img src="${drop.preview}" alt="">` : `<span class="drop-icon">▤</span>`}<span><strong>${escapeHTML(drop.fileName || "Datei")}</strong><br><span class="drop-time">${escapeHTML(drop.fileSize || "")} · Datei nur in dieser Sitzung verfügbar</span></span></div>`;
      }
      const actions = drop.type === "file"
        ? `<button class="mini-button" data-action="download" data-id="${drop.id}">Herunterladen</button>`
        : `<button class="mini-button" data-action="copy" data-id="${drop.id}">Kopieren</button>${drop.type === "link" && safeLink(drop.content) ? `<button class="mini-button" data-action="open" data-id="${drop.id}">Link öffnen ↗</button>` : ""}`;
      item.innerHTML = `<div class="drop-icon">${icon}</div><div class="drop-main"><div class="drop-top"><span class="drop-type">${drop.type === "link" ? "LINK" : drop.type === "file" ? "DATEI" : "TEXT"}</span><span class="drop-time">${timeLabel(drop.createdAt)}</span></div>${content}<div class="drop-actions">${actions}<button class="mini-button" data-action="delete" data-id="${drop.id}">Löschen</button></div></div>`;
      dropList.appendChild(item);
    });
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
    return (bytes/1024/1024).toFixed(1) + " MB";
  }
  $$(".type-tab").forEach(btn => btn.addEventListener("click", () => setType(btn.dataset.type)));
  fileInput.addEventListener("change", () => {
    selected = [...fileInput.files];
    selectedFiles.textContent = selected.length ? selected.map(f => `${f.name} (${formatSize(f.size)})`).join(" · ") : "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (activeType === "file") {
      if (!selected.length) return notify("Wähle zuerst eine Datei aus.");
      for (const file of selected) {
        const drop = {id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), type:"file", fileName:file.name, fileSize:formatSize(file.size), createdAt:Date.now(), mime:file.type, isImage:file.type.startsWith("image/"), fileData:file};
        if (drop.isImage) {
          try { drop.preview = await new Promise((resolve,reject) => { const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); } catch {}
        }
        // Browser session-only file registry; refreshing can remove access to the actual file.
        fileRegistry.set(drop.id, file); drops.unshift(drop);
      }
      saveDrops(); render(); selected=[]; fileInput.value=""; selectedFiles.textContent=""; notify("Datei hinzugefügt. Für andere Geräte ist noch ein Backend nötig."); return;
    }
    const content = input.value.trim();
    if (!content) return notify("Füge zuerst etwas ein.");
    if (activeType === "link" && !safeLink(content)) return notify("Bitte gib einen gültigen Link mit https:// oder http:// ein.");
    addDrop({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),type:activeType,content,createdAt:Date.now()});
    input.value = "";
  });
  const fileRegistry = new Map();
  dropList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]"); if (!button) return;
    const drop = drops.find(d => d.id === button.dataset.id); if (!drop) return;
    const action = button.dataset.action;
    if (action === "delete") { drops = drops.filter(d => d.id !== drop.id); fileRegistry.delete(drop.id); saveDrops(); render(); notify("Drop gelöscht."); }
    if (action === "copy") {
      try { await navigator.clipboard.writeText(drop.content); notify("In Zwischenablage kopiert."); }
      catch { const temp=document.createElement("textarea");temp.value=drop.content;document.body.appendChild(temp);temp.select();document.execCommand("copy");temp.remove();notify("Kopiert."); }
    }
    if (action === "open") { const url=safeLink(drop.content); if(url) window.open(url,"_blank","noopener,noreferrer"); }
    if (action === "download") {
      const file = fileRegistry.get(drop.id);
      if (!file) return notify("Die Datei ist nach einem Neuladen nicht mehr verfügbar. Bitte erneut auswählen.");
      const url=URL.createObjectURL(file), a=document.createElement("a");a.href=url;a.download=file.name;a.click();URL.revokeObjectURL(url);
    }
  });
  $("#copyLatest").addEventListener("click", async () => {
    const latest = drops.find(d => d.type === "text" || d.type === "link");
    if (!latest) return notify("Noch kein Text oder Link vorhanden.");
    try { await navigator.clipboard.writeText(latest.content); notify("Letzter Text/Link kopiert."); } catch { notify("Kopieren ist in diesem Browser nicht erlaubt."); }
  });
  $("#clearAll").addEventListener("click", () => {
    if (!drops.length) return notify("Der Verlauf ist bereits leer.");
    if (confirm("Möchtest du alle Drops aus diesem Browser löschen?")) { drops=[];fileRegistry.clear();saveDrops();render();notify("Verlauf gelöscht."); }
  });
  $("#themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("leondrop-theme", document.body.classList.contains("light") ? "light" : "dark");
  });
  if (localStorage.getItem("leondrop-theme") === "light") document.body.classList.add("light");
  input.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") form.requestSubmit(); });
  $("#deviceLabel").textContent = /Android|iPhone|iPad/i.test(navigator.userAgent) ? "Handy / Tablet" : "Laptop / Desktop";
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  render();
})();