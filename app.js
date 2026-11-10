
const $ = (id) => document.getElementById(id);

let projects = JSON.parse(localStorage.getItem("minicode_projects") || "[]");
let currentProjectId = null;
let activeTab = "html";

const defaultHTML = `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Менің сайтым</title>
</head>
<body>
  <h1>Менің алғашқы сайтым!</h1>
  <p>Бұл сайт MiniCode арқылы жасалды.</p>
  <button onclick="hello()">Басу</button>
</body>
</html>`;

const defaultCSS = `body {
  font-family: Arial, sans-serif;
  background: #f0f2f5;
  text-align: center;
  padding: 40px;
}

h1 {
  color: #333;
}

button {
  background: #655cff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
}`;

const defaultJS = `function hello() {
  alert("Сәлем! Бұл MiniCode арқылы жасалған сайт.");
}`;

function saveProjects() {
  localStorage.setItem("minicode_projects", JSON.stringify(projects));
  $("saveStatus").textContent = "Сақталды";
}

function createProject() {
  const name = $("newProjectName").value.trim();

  if (!name) {
    alert("Жоба атауын енгіз.");
    return;
  }

  const project = {
    id: Date.now().toString(),
    name,
    slug: makeSlug(name),
    html: defaultHTML,
    css: defaultCSS,
    js: defaultJS,
    domain: "",
    published: false
  };

  projects.push(project);
  saveProjects();

  $("newProjectName").value = "";
  $("createModal").classList.add("hidden");

  openProject(project.id);
  renderProjects();
}

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderProjects() {
  const list = $("projectList");
  list.innerHTML = "";

  $("emptyState").classList.toggle("hidden", projects.length > 0);

  projects.forEach(project => {
    const card = document.createElement("div");
    card.className = "project-card";

    const title = document.createElement("h3");
    title.textContent = project.name;

    const address = document.createElement("p");
    address.textContent = project.slug + ".minicode.site";

    const status = document.createElement("p");
    status.textContent = project.published
      ? "Жарияланған"
      : "Жоба";

    card.append(title, address, status);

    card.addEventListener("click", () => {
      openProject(project.id);
    });

    list.appendChild(card);
  });
}

function openProject(id) {
  const project = projects.find(item => item.id === id);

  if (!project) return;

  currentProjectId = id;

  $("dashboard").classList.add("hidden");
  $("editor").classList.remove("hidden");

  $("currentProjectName").textContent = project.name;
  $("siteName").value = project.name;
  $("siteSlug").value = project.slug;

  $("htmlCode").value = project.html;
  $("cssCode").value = project.css;
  $("jsCode").value = project.js;

  $("customDomain").value = project.domain || "";

  $("projectStatus").textContent = "Өңдеу режимі";

  updatePublishUI(project);
  switchTab("html");
  previewSite();
}

function getCurrentProject() {
  return projects.find(item => item.id === currentProjectId);
}

function updateCurrentProject() {
  const project = getCurrentProject();

  if (!project) return;

  project.name = $("siteName").value.trim() || "Атаусыз сайт";
  project.slug = makeSlug($("siteSlug").value);
  project.html = $("htmlCode").value;
  project.css = $("cssCode").value;
  project.js = $("jsCode").value;
  project.domain = $("customDomain").value.trim();

  $("currentProjectName").textContent = project.name;

  saveProjects();
  renderProjects();
}

function switchTab(tab) {
  activeTab = tab;

  $("htmlCode").classList.toggle("hidden", tab !== "html");
  $("cssCode").classList.toggle("hidden", tab !== "css");
  $("jsCode").classList.toggle("hidden", tab !== "js");

  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tab
    );
  });
}

function previewSite() {
  const html = $("htmlCode").value;
  const css = $("cssCode").value;
  const js = $("jsCode").value;

  const frame = $("previewFrame");

  const page = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${css}</style>
    </head>
    <body>
      ${html}
      <script>${js}<\/script>
    </body>
    </html>
  `;

  frame.srcdoc = page;
}

function downloadHTML() {
  const html = $("htmlCode").value;
  const css = $("cssCode").value;
  const js = $("jsCode").value;

  const finalHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${css}</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;

  const blob = new Blob([finalHTML], {
    type: "text/html;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "index.html";
  link.click();

  URL.revokeObjectURL(url);
}

function checkSlug() {
  const slug = makeSlug($("siteSlug").value);
  const status = $("slugStatus");

  $("siteSlug").value = slug;

  if (!slug) {
    status.textContent = "Сілтеме атауын енгіз.";
    status.style.color = "#ef6262";
    return;
  }

  const taken = projects.some(project =>
    project.slug === slug &&
    project.id !== currentProjectId
  );

  if (taken) {
    status.textContent = "Бұл атау басқа жобаға берілген.";
    status.style.color = "#ef6262";
  } else {
    status.textContent =
      "Бұл атау осы құрылғыдағы жобаларың арасында бос.";
    status.style.color = "#35c98b";
  }
}

function connectDomain() {
  const domain = $("customDomain").value.trim();
  const status = $("domainStatus");

  const validDomain =
    /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);

  if (!validDomain) {
    status.textContent = "Домен атауы дұрыс емес.";
    status.style.color = "#ef6262";
    return;
  }

  status.textContent =
    "Домен енгізілді. DNS байланысын тексеру үшін сервер қажет.";
  status.style.color = "#35c98b";

  updateCurrentProject();
}

function updatePublishUI(project) {
  $("publishBtn").classList.toggle("hidden", project.published);
  $("updatePublishBtn").classList.toggle("hidden", !project.published);
  $("unpublishBtn").classList.toggle("hidden", !project.published);

  $("publishedAddress").textContent = project.published
    ? project.slug + ".minicode.site"
    : "Әзірге жарияланбаған";
}

function publishSite() {
  alert(
    "Жариялау сервері әлі қосылған жоқ. Қазір бұл жоба тек осы браузерде сақталады."
  );
}

function updatePublishedSite() {
  alert(
    "Сайтты жаңарту үшін алдымен серверлік жариялау жүйесін қосу керек."
  );
}

function unpublishSite() {
  alert(
    "Жариялауды басқару серверлік жүйе қосылғаннан кейін іске қосылады."
  );
}

function goBack() {
  updateCurrentProject();

  $("editor").classList.add("hidden");
  $("dashboard").classList.remove("hidden");

  currentProjectId = null;
  renderProjects();
}

$("newProjectBtn").addEventListener("click", () => {
  $("createModal").classList.remove("hidden");
});

$("emptyCreateBtn").addEventListener("click", () => {
  $("createModal").classList.remove("hidden");
});

$("cancelCreateBtn").addEventListener("click", () => {
  $("createModal").classList.add("hidden");
});

$("createProjectBtn").addEventListener("click", createProject);

$("backBtn").addEventListener("click", goBack);

$("saveBtn").addEventListener("click", () => {
  updateCurrentProject();
  $("projectStatus").textContent = "Сақталды";
});

$("previewBtn").addEventListener("click", previewSite);

$("downloadBtn").addEventListener("click", downloadHTML);

$("checkSlugBtn").addEventListener("click", checkSlug);

$("connectDomainBtn").addEventListener("click", connectDomain);

$("publishBtn").addEventListener("click", publishSite);

$("updatePublishBtn").addEventListener("click", updatePublishedSite);

$("unpublishBtn").addEventListener("click", unpublishSite);

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

[
  "siteName",
  "siteSlug",
  "htmlCode",
  "cssCode",
  "jsCode",
  "customDomain"
].forEach(id => {
  $(id).addEventListener("input", () => {
    $("saveStatus").textContent = "Өзгерістер бар";
  });
});

renderProjects();
