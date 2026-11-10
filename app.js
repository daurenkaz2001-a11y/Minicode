const STORAGE_KEY = "minicode_projects_v1";
const starterHTML = `<!doctype html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Менің алғашқы сайтым</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="card">
    <span class="tag">MINICODE</span>
    <h1>Сәлем, әлем! 👋</h1>
    <p>Бұл — менің алғашқы веб-сайтым.</p>
    <button id="helloBtn">Мені бас</button>
    <p id="message"></p>
  </main>
  <script src="script.js"><\/script>
</body>
</html>`;
const starterCSS = `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #dbeafe, #ede9fe);
  color: #172554;
}
.card {
  width: min(90%, 420px);
  padding: 36px;
  border-radius: 22px;
  background: white;
  text-align: center;
  box-shadow: 0 18px 50px #33415522;
}
.tag { color: #6366f1; font-size: 12px; font-weight: bold; letter-spacing: 2px; }
h1 { font-size: 30px; }
button {
  border: 0; border-radius: 10px; padding: 12px 20px;
  background: #4f46e5; color: white; font-weight: bold;
}`;
const starterJS = `document.getElementById("helloBtn").addEventListener("click", () => {
  document.getElementById("message").textContent = "Бәрекелді! Сайтың жұмыс істеп тұр.";
});`;

let projects = loadProjects();
let currentProjectId = null;
let activeFile = "html";
let toastTimer;

const $ = (id) => document.getElementById(id);
function loadProjects() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  $("saveStatus").textContent = "Сақталды";
  renderProjects();
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderProjects() {
  const grid = $("projectGrid");
  grid.innerHTML = "";
  $("projectCount").textContent = projects.length;
  $("emptyState").style.display = projects.length ? "none" : "block";
  if (!projects.length) $("lastEdited").textContent = "—";
  else {
    const latest = [...projects].sort((a,b) => b.updatedAt-a.updatedAt)[0];
    $("lastEdited").textContent = new Date(latest.updatedAt).toLocaleDateString("kk-KZ");
  }
  projects.slice().sort((a,b) => b.updatedAt-a.updatedAt).forEach(project => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `<div class="project-icon">&lt;/&gt;</div>
      <h3>${escapeHTML(project.name)}</h3>
      <p>${escapeHTML(project.description || "HTML · CSS · JavaScript")}</p>
      <div class="project-meta"><span>${new Date(project.updatedAt).toLocaleDateString("kk-KZ")}</span>
      <button class="open-project">Ашу →</button></div>`;
    card.querySelector("button").addEventListener("click", () => openProject(project.id));
    grid.appendChild(card);
  });
}
function openModal() {
  $("newProjectModal").hidden = false;
  $("projectName").focus();
}
function closeModal() { $("newProjectModal").hidden = true; $("newProjectForm").reset(); }
function createProject(name, description) {
  const project = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name, description,
    files: { html: starterHTML, css: starterCSS, js: starterJS },
    updatedAt: Date.now()
  };
  projects.push(project);
  persist();
  closeModal();
  openProject(project.id);
  showToast("Жоба құрылды және сақталды");
}
function currentProject() { return projects.find(p => p.id === currentProjectId); }
function openProject(id) {
  currentProjectId = id;
  activeFile = "html";
  const project = currentProject();
  if (!project) return;
  $("dashboard").classList.remove("active-page");
  $("editorPage").classList.add("active-page");
  $("breadcrumb").textContent = "Жобалар / " + project.name;
  $("editorProjectName").textContent = project.name;
  document.querySelectorAll(".file-tab").forEach(b => b.classList.toggle("active", b.dataset.file === activeFile));
  loadActiveFile();
  renderPreview();
}
function loadActiveFile() {
  const project = currentProject();
  if (!project) return;
  const labels = {html:"index.html",css:"style.css",js:"script.js"};
  $("currentFile").textContent = labels[activeFile];
  $("codeEditor").value = project.files[activeFile] || "";
  updateLineCount();
}
function updateLineCount() {
  const count = $("codeEditor").value.split("\n").length;
  $("lineCount").textContent = count + (count === 1 ? " жол" : " жол");
}
function saveCurrentFile(showMessage=false) {
  const project = currentProject();
  if (!project) return;
  project.files[activeFile] = $("codeEditor").value;
  project.updatedAt = Date.now();
  persist();
  if (showMessage) showToast("Өзгерістер сақталды");
}
function buildDocument(project) {
  let htmlDoc = project.files.html || starterHTML;
  const css = project.files.css || "";
  const js = project.files.js || "";
  htmlDoc = htmlDoc.replace(/<link[^>]+href=["']style\.css["'][^>]*>/i, "");
  htmlDoc = htmlDoc.replace(/<script[^>]+src=["']script\.js["'][^>]*><\/script>/i, "");
  if (/<\/head>/i.test(htmlDoc)) htmlDoc = htmlDoc.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`);
  else htmlDoc = `<style>${css}</style>\n` + htmlDoc;
  if (/<\/body>/i.test(htmlDoc)) htmlDoc = htmlDoc.replace(/<\/body>/i, `<script>\n${js}\n<\/script>\n</body>`);
  else htmlDoc += `<script>${js}<\/script>`;
  return htmlDoc;
}
function renderPreview() {
  saveCurrentFile(false);
  const project = currentProject();
  if (!project) return;
  $("previewFrame").srcdoc = buildDocument(project);
}
function downloadHTML() {
  saveCurrentFile(false);
  const project = currentProject();
  if (!project) return;
  const blob = new Blob([buildDocument(project)], {type:"text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (project.name.trim().replace(/[^\p{L}\p{N}-]+/gu,"-").replace(/^-|-$/g,"") || "my-site") + ".html";
  a.click();
  URL.revokeObjectURL(url);
  showToast("HTML файлы жүктелді");
}
function backToDashboard() {
  saveCurrentFile(false);
  $("editorPage").classList.remove("active-page");
  $("dashboard").classList.add("active-page");
  $("breadcrumb").textContent = "Жобалар";
  renderProjects();
}
$("newProjectBtn").addEventListener("click", openModal);
$("emptyCreateBtn").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);
$("newProjectForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("projectName").value.trim();
  if (!name) return;
  createProject(name, $("projectDescription").value.trim());
});
$("backBtn").addEventListener("click", backToDashboard);
$("navProjects").addEventListener("click", backToDashboard);
$("saveBtn").addEventListener("click", () => saveCurrentFile(true));
$("previewBtn").addEventListener("click", () => { renderPreview(); showToast("Алдын ала қарау жаңартылды"); });
$("refreshPreview").addEventListener("click", renderPreview);
$("downloadBtn").addEventListener("click", downloadHTML);
$("codeEditor").addEventListener("input", () => {
  updateLineCount();
  $("saveStatus").textContent = "Сақталмаған өзгеріс";
  saveCurrentFile(false);
});
document.querySelectorAll(".file-tab").forEach(button => {
  button.addEventListener("click", () => {
    saveCurrentFile(false);
    activeFile = button.dataset.file;
    document.querySelectorAll(".file-tab").forEach(b => b.classList.toggle("active", b === button));
    loadActiveFile();
  });
});
$("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.addEventListener("click", e => {
  if (window.innerWidth <= 800 && !e.target.closest("#sidebar") && !e.target.closest("#mobileMenu")) {
    $("sidebar").classList.remove("open");
  }
});
window.addEventListener("beforeunload", () => saveCurrentFile(false));
renderProjects();
