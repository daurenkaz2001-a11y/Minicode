
"use strict";

/* =====================================
   MINICODE v0.3
   Local project and file manager
===================================== */

const STORAGE_KEY = "minicode_v03_projects";
const ACTIVE_KEY = "minicode_v03_active";
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;

let projects = loadProjects();
let activeProjectId = localStorage.getItem(ACTIVE_KEY);
let activeFileId = null;
let openedFiles = [];
let collapsedFolders = new Set();

/* ---------- ELEMENTS ---------- */

const $ = (id) => document.getElementById(id);

const fileTree = $("fileTree");
const codeEditor = $("codeEditor");
const fileTabs = $("fileTabs");
const fileBreadcrumb = $("fileBreadcrumb");
const imagePreview = $("imagePreview");
const fileType = $("fileType");
const fileSaveStatus = $("fileSaveStatus");
const previewFrame = $("previewFrame");

const fileInput = $("fileInput");

const addMenu = $("addMenu");
const addMenuBtn = $("addMenuBtn");
const uploadBtn = $("uploadBtn");
const menuUploadBtn = $("menuUploadBtn");
const newFileBtn = $("newFileBtn");
const newFolderBtn = $("newFolderBtn");

const renameFileBtn = $("renameFileBtn");
const deleteFileBtn = $("deleteFileBtn");
const collapseFoldersBtn = $("collapseFoldersBtn");

const previewBtn = $("previewBtn");
const downloadZipBtn = $("downloadZipBtn");

const publishBtn = $("publishBtn");
const updatePublishBtn = $("updatePublishBtn");
const unpublishBtn = $("unpublishBtn");

const domainConnectBtn = $("domainConnectBtn");
const customDomainInput = $("customDomainInput");

const projectList = $("projectList");
const projectNameDisplay = $("currentProjectName");

/* ---------- DATA ---------- */

function loadProjects() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        if (fileSaveStatus) {
            fileSaveStatus.textContent = "Сақталды";
        }
    } catch (error) {
        console.error(error);
        alert(
            "Сақтау мүмкін болмады. Жад толып кеткен болуы мүмкін. " +
            "Үлкен файлдарды әзірге жүктемеңіз."
        );
        if (fileSaveStatus) {
            fileSaveStatus.textContent = "Сақтау қатесі";
        }
    }
}

function createId() {
    return "id_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);
}

function getProject() {
    return projects.find(p => p.id === activeProjectId) || null;
}

function getFile(id) {
    const project = getProject();
    if (!project) return null;
    return project.files.find(f => f.id === id) || null;
}

function getFileByPath(path) {
    const project = getProject();
    if (!project) return null;
    return project.files.find(f => f.path === path) || null;
}

function normalizePath(path) {
    return String(path || "")
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/\/+/g, "/");
}

function getParentPath(path) {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/");
}

function getFileName(path) {
    return path.split("/").pop();
}

function isImageFile(name) {
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name);
}

function getExtension(name) {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

/* ---------- DEFAULT PROJECT FILES ---------- */

function defaultFiles() {
    return [
        {
            id: createId(),
            path: "index.html",
            type: "text",
            content:
`<!DOCTYPE html>
<html lang="kk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Менің сайтым</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <h1>Сәлем, MiniCode!</h1>
    <p>Менің алғашқы сайтым.</p>

    <script src="script.js"><\/script>
</body>
</html>`
        },
        {
            id: createId(),
            path: "style.css",
            type: "text",
            content:
`body {
    font-family: Arial, sans-serif;
    background: #f4f4f4;
    text-align: center;
    padding: 40px;
}

h1 {
    color: #2563eb;
}`
        },
        {
            id: createId(),
            path: "script.js",
            type: "text",
            content:
`console.log("MiniCode іске қосылды!");`
        }
    ];
}

/* ---------- PROJECT MANAGEMENT ---------- */

function createProject(name, slug) {
    name = String(name || "").trim();
    slug = String(slug || "").trim().toLowerCase();

    if (!name) {
        alert("Жоба атауын енгізіңіз.");
        return;
    }

    if (!slug) {
        slug = name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
        alert("URL атауында тек ағылшын әріптері, сандар және дефис болсын.");
        return;
    }

    if (projects.some(p => p.slug === slug)) {
        alert("Бұл атау осы құрылғыдағы жобалардың бірінде қолданылған.");
        return;
    }

    const project = {
        id: createId(),
        name,
        slug,
        files: defaultFiles(),
        visibility: "public",
        published: false,
        domain: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    projects.push(project);
    activeProjectId = project.id;
    localStorage.setItem(ACTIVE_KEY, activeProjectId);
    saveProjects();

    closeAllModals();
    showEditor();
}

function openProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    activeProjectId = id;
    localStorage.setItem(ACTIVE_KEY, id);

    activeFileId = null;
    openedFiles = [];
    collapsedFolders = new Set();

    showEditor();
}

function deleteProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (!confirm(`"${project.name}" жобасын өшіресіз бе?`)) return;

    projects = projects.filter(p => p.id !== id);

    if (activeProjectId === id) {
        activeProjectId = null;
        localStorage.removeItem(ACTIVE_KEY);
        showDashboard();
    }

    saveProjects();
    renderProjectList();
}

function showDashboard() {
    const dashboard = $("dashboard");
    const editorView = $("editorView");

    if (dashboard) dashboard.hidden = false;
    if (editorView) editorView.hidden = true;

    renderProjectList();
}

function showEditor() {
    const dashboard = $("dashboard");
    const editorView = $("editorView");

    if (dashboard) dashboard.hidden = true;
    if (editorView) editorView.hidden = false;

    const project = getProject();
    if (!project) {
        showDashboard();
        return;
    }

    if (projectNameDisplay) {
        projectNameDisplay.textContent = project.name;
    }

    const nameInput = $("projectNameInput");
    if (nameInput) nameInput.value = project.name;

    const slugInput = $("projectSlugInput");
    if (slugInput) slugInput.value = project.slug;

    const visibility = $("visibility");
    if (visibility) visibility.value = project.visibility || "public";

    const domainInput = $("customDomainInput");
    if (domainInput) domainInput.value = project.domain || "";

    renderFileTree();
    renderTabs();

    if (project.files.length > 0) {
        const first = project.files.find(f => f.path === "index.html")
            || project.files.find(f => f.type === "text")
            || project.files[0];

        openFile(first.id);
    }

    updatePublishStatus();
}

/* ---------- PROJECT LIST ---------- */

function renderProjectList() {
    if (!projectList) return;

    projectList.innerHTML = "";

    if (projects.length === 0) {
        projectList.innerHTML =
            '<p class="empty-state">Әзірге жобалар жоқ.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement("div");
        card.className = "project-card";

        const title = document.createElement("h3");
        title.textContent = project.name;

        const url = document.createElement("p");
        url.textContent = project.published
            ? project.slug + " (жарияланған)"
            : project.slug + " (жарияланбаған)";

        const openButton = document.createElement("button");
        openButton.textContent = "Ашу";
        openButton.addEventListener("click", () => openProject(project.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Өшіру";
        deleteButton.addEventListener("click", () => deleteProject(project.id));

        card.append(title, url, openButton, deleteButton);
        projectList.appendChild(card);
    });
}

/* ---------- FILE TREE ---------- */

function renderFileTree() {
    if (!fileTree) return;

    const project = getProject();
    if (!project) return;

    fileTree.innerHTML = "";

    const folders = new Set();

    project.files.forEach(file => {
        const parts = file.path.split("/");
        for (let i = 1; i < parts.length; i++) {
            folders.add(parts.slice(0, i).join("/"));
        }
    });

    const allPaths = [
        ...Array.from(folders).map(path => ({
            path,
            folder: true
        })),
        ...project.files.map(file => ({
            path: file.path,
            folder: false,
            file
        }))
    ];

    allPaths.sort((a, b) => {
        const depthA = a.path.split("/").length;
        const depthB = b.path.split("/").length;

        if (depthA !== depthB) return depthA - depthB;

        if (a.folder !== b.folder) return a.folder ? -1 : 1;

        return a.path.localeCompare(b.path);
    });

    allPaths.forEach(item => {
        const parent = getParentPath(item.path);

        if (parent && collapsedFolders.has(parent)) return;

        let hiddenByParent = false;
        let current = parent;

        while (current) {
            if (collapsedFolders.has(current)) {
                hiddenByParent = true;
                break;
            }
            current = getParentPath(current);
        }

        if (hiddenByParent) return;

        const row = document.createElement("div");
        row.className = "file-tree-item";

        const depth = item.path.split("/").length - 1;
        row.style.paddingLeft = `${10 + depth * 16}px`;

        if (item.folder) {
            row.classList.add("folder-item");

            const icon = document.createElement("span");
            icon.textContent = collapsedFolders.has(item.path) ? "▸ " : "▾ ";

            const name = document.createElement("span");
            name.textContent = getFileName(item.path);

            row.append(icon, name);

            row.addEventListener("click", () => {
                if (collapsedFolders.has(item.path)) {
                    collapsedFolders.delete(item.path);
                } else {
                    collapsedFolders.add(item.path);
                }
                renderFileTree();
            });
        } else {
            row.classList.add("file-item");

            if (item.file.id === activeFileId) {
                row.classList.add("active");
            }

            const icon = document.createElement("span");
            icon.textContent = isImageFile(item.path) ? "🖼 " : "📄 ";

            const name = document.createElement("span");
            name.textContent = getFileName(item.path);

            row.append(icon, name);
            row.addEventListener("click", () => openFile(item.file.id));
        }

        fileTree.appendChild(row);
    });
}

/* ---------- OPEN AND EDIT FILES ---------- */

function openFile(id) {
    const file = getFile(id);
    if (!file) return;

    activeFileId = id;

    if (!openedFiles.includes(id)) {
        openedFiles.push(id);
    }

    renderFileTree();
    renderTabs();

    const image = isImageFile(file.path) ||
        (file.type === "image" && file.content);

    if (image) {
        if (codeEditor) codeEditor.hidden = true;
        if (imagePreview) {
            imagePreview.hidden = false;
            imagePreview.src = file.content;
        }
        if (fileType) fileType.textContent = "Сурет";
    } else {
        if (imagePreview) imagePreview.hidden = true;
        if (codeEditor) {
            codeEditor.hidden = false;
            codeEditor.value = file.content || "";
        }
        if (fileType) fileType.textContent =
            getExtension(file.path).toUpperCase() || "ФАЙЛ";
    }

    if (fileBreadcrumb) {
        fileBreadcrumb.textContent = file.path;
    }

    if (renameFileBtn) renameFileBtn.disabled = false;
    if (deleteFileBtn) deleteFileBtn.disabled = false;

    if (fileSaveStatus) fileSaveStatus.textContent = "Сақталды";
}

function renderTabs() {
    if (!fileTabs) return;

    fileTabs.innerHTML = "";

    openedFiles.forEach(id => {
        const file = getFile(id);
        if (!file) return;

        const tab = document.createElement("button");
        tab.className = "file-tab";
        if (id === activeFileId) tab.classList.add("active");

        tab.textContent = getFileName(file.path);
        tab.addEventListener("click", () => openFile(id));

        fileTabs.appendChild(tab);
    });
}

if (codeEditor) {
    codeEditor.addEventListener("input", () => {
        const file = getFile(activeFileId);
        if (!file || isImageFile(file.path)) return;

        file.content = codeEditor.value;

        const project = getProject();
        project.updatedAt = new Date().toISOString();

        saveProjects();

        if (fileSaveStatus) {
            fileSaveStatus.textContent = "Сақталды";
        }
    });
}

/* ---------- NEW FILE ---------- */

function addFile(path) {
    const project = getProject();
    if (!project) return;

    path = normalizePath(path);

    if (!path || path.endsWith("/")) {
        alert("Файл атауын дұрыс енгізіңіз.");
        return;
    }

    if (project.files.some(f => f.path === path)) {
        alert("Мұндай файл бар.");
        return;
    }

    const file = {
        id: createId(),
        path,
        type: "text",
        content: ""
    };

    project.files.push(file);
    project.updatedAt = new Date().toISOString();

    saveProjects();
    closeAllModals();
    openFile(file.id);
    renderFileTree();
}

function addFolder(path) {
    const project = getProject();
    if (!project) return;

    path = normalizePath(path).replace(/\/+$/, "");

    if (!path) {
        alert("Бума атауын енгізіңіз.");
        return;
    }

    const alreadyExists = project.files.some(f =>
        f.path.startsWith(path + "/")
    );

    if (alreadyExists) {
        alert("Бұл бума әлдеқашан бар.");
        return;
    }

    project.files.push({
        id: createId(),
        path: path + "/.folder",
        type: "text",
        content: ""
    });

    saveProjects();
    closeAllModals();
    renderFileTree();
}

/* ---------- RENAME FILE ---------- */

function renameFile(id, newName) {
    const project = getProject();
    const file = getFile(id);

    if (!project || !file) return;

    newName = normalizePath(newName);

    if (!newName) {
        alert("Жаңа атауды енгізіңіз.");
        return;
    }

    if (project.files.some(f =>
        f.id !== id && f.path === newName
    )) {
        alert("Мұндай атау бар.");
        return;
    }

    const oldPath = file.path;
    const isFolder = oldPath.endsWith("/.folder");

    if (isFolder) {
        const oldFolder = getParentPath(oldPath);
        const newFolder = newName.replace(/\/+$/, "");

        project.files.forEach(f => {
            if (f.path === oldPath) {
                f.path = newFolder + "/.folder";
            } else if (f.path.startsWith(oldFolder + "/")) {
                f.path = newFolder + f.path.slice(oldFolder.length);
            }
        });
    } else {
        file.path = newName;
    }

    saveProjects();
    closeAllModals();
    renderFileTree();
    renderTabs();

    if (activeFileId === id) openFile(id);
}

/* ---------- DELETE FILE ---------- */

function deleteFile(id) {
    const project = getProject();
    const file = getFile(id);

    if (!project || !file) return;

    if (!confirm(`"${file.path}" файлын өшіресіз бе?`)) return;

    project.files = project.files.filter(f => f.id !== id);
    openedFiles = openedFiles.filter(openId => openId !== id);

    if (activeFileId === id) {
        activeFileId = null;

        if (codeEditor) {
            codeEditor.value = "";
            codeEditor.hidden = false;
        }

        if (imagePreview) imagePreview.hidden = true;
        if (fileBreadcrumb) fileBreadcrumb.textContent = "";
        if (fileType) fileType.textContent = "";
    }

    saveProjects();
    renderFileTree();
    renderTabs();

    if (project.files.length > 0 && !activeFileId) {
        openFile(project.files[0].id);
    }
}

/* ---------- UPLOAD FILES ---------- */

function uploadFiles(files) {
    const project = getProject();
    if (!project) return;

    Array.from(files).forEach(file => {
        if (file.size > MAX_UPLOAD_SIZE) {
            alert(
                `${file.name} файлы 2 МБ-тан үлкен. ` +
                "Әзірге мұндай файлдарды жүктеу шектелген."
            );
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const path = normalizePath(file.webkitRelativePath || file.name);

            if (project.files.some(f => f.path === path)) {
                if (!confirm(`${path} бұрыннан бар. Ауыстырасыз ба?`)) {
                    return;
                }

                project.files = project.files.filter(f => f.path !== path);
            }

            const image = file.type.startsWith("image/");

            project.files.push({
                id: createId(),
                path,
                type: image ? "image" : "text",
                content: reader.result
            });

            saveProjects();
            renderFileTree();
        };

        reader.onerror = () => {
            alert(file.name + " файлын оқу мүмкін болмады.");
        };

        if (
            file.type.startsWith("image/") ||
            file.type.startsWith("text/") ||
            /\.(html|css|js|json|xml|svg|md|txt|csv)$/i.test(file.name)
        ) {
            reader.readAsDataURL(file);
        } else {
            alert(
                file.name + " форматы әзірге қолдау таппайды."
            );
        }
    });
}

if (fileInput) {
    fileInput.addEventListener("change", () => {
        uploadFiles(fileInput.files);
        fileInput.value = "";
    });
}

/* ---------- BUILD PREVIEW ---------- */

function buildPreview() {
    const project = getProject();
    if (!project) return "";

    let htmlFile = project.files.find(f => f.path === "index.html");

    if (!htmlFile) {
        htmlFile = project.files.find(f =>
            f.path.toLowerCase().endsWith(".html")
        );
    }

    if (!htmlFile) {
        alert("Жобада HTML файлы жоқ.");
        return "";
    }

    let html = htmlFile.content || "";

    if (html.startsWith("data:")) {
        html = "";
    }

    const textFiles = project.files.filter(f =>
        f.type === "text" && !f.content.startsWith("data:")
    );

    const assets = project.files.filter(f =>
        f.type === "image" || f.content.startsWith("data:")
    );

    function findAsset(path) {
        path = normalizePath(path);

        const candidates = [
            path,
            getParentPath(htmlFile.path)
                ? getParentPath(htmlFile.path) + "/" + path
                : path
        ];

        return assets.find(f => candidates.includes(f.path));
    }

    function resolveAsset(path) {
        const asset = findAsset(path);
        return asset ? asset.content : path;
    }

  
