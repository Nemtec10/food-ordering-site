const setupTitle = document.getElementById("setupTitle");
const setupMeta = document.getElementById("setupMeta");
const checklistNode = document.getElementById("checklist");
const setupStatus = document.getElementById("setupStatus");
const setupPublicLink = document.getElementById("setupPublicLink");
const menuName = document.getElementById("menuName");
const menuPrice = document.getElementById("menuPrice");
const menuImage = document.getElementById("menuImage");
const addMenuBtn = document.getElementById("addMenuBtn");
const menuList = document.getElementById("menuList");
const postTitle = document.getElementById("postTitle");
const postBody = document.getElementById("postBody");
const postUrl = document.getElementById("postUrl");
const addPostBtn = document.getElementById("addPostBtn");
const postList = document.getElementById("postList");

const params = new URLSearchParams(window.location.search);
const partnerId = String(params.get("partnerId") || "").trim();
const email = String(params.get("email") || "").trim().toLowerCase();

let currentPartner = null;
let currentMenu = [];
let currentPosts = [];
let currentChecklist = null;

const formatCurrency = (value = 0) => `${Math.max(0, Number(value || 0)).toLocaleString()} TZS`;

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });

const setStatus = (text = "", isError = false) => {
  if (!setupStatus) return;
  setupStatus.textContent = text;
  setupStatus.style.color = isError ? "#ff9eb1" : "#9fe8d2";
};

const renderChecklist = () => {
  if (!checklistNode) return;
  checklistNode.innerHTML = "";
  if (!currentChecklist?.checks?.length) return;
  for (const row of currentChecklist.checks) {
    const div = document.createElement("div");
    div.className = `check-row ${row.done ? "done" : ""}`;
    div.textContent = `${row.done ? "✓" : "•"} ${row.label}`;
    checklistNode.appendChild(div);
  }
};

const renderMenu = () => {
  if (!menuList) return;
  if (!currentMenu.length) {
    menuList.innerHTML = '<div class="item">No menu items yet.</div>';
    return;
  }
  menuList.innerHTML = currentMenu
    .map(
      (item) => `
        <article class="item">
          <div class="item-head">
            <strong>${escapeHtml(item.itemName || "Item")}</strong>
            <strong>${formatCurrency(item.price || 0)}</strong>
          </div>
          <div class="muted">Availability: ${Number(item.available || 0) ? "Available" : "Unavailable"}</div>
          <button type="button" data-toggle-id="${escapeHtml(item.id)}" data-next="${Number(item.available || 0) ? "0" : "1"}">
            ${Number(item.available || 0) ? "Set Unavailable" : "Set Available"}
          </button>
          ${item.imageData ? `<img src="${escapeHtml(item.imageData)}" alt="${escapeHtml(item.itemName || "Item")}" />` : ""}
        </article>
      `
    )
    .join("");
};

const renderPosts = () => {
  if (!postList) return;
  if (!currentPosts.length) {
    postList.innerHTML = '<div class="item">No posts yet.</div>';
    return;
  }
  postList.innerHTML = currentPosts
    .map(
      (post) => `
        <article class="item">
          <strong>${escapeHtml(post.title || "Post")}</strong>
          <p>${escapeHtml(post.body || "")}</p>
          <div class="muted">${escapeHtml(post.createdAt || "")}</div>
          ${post.externalUrl ? `<a href="${escapeHtml(post.externalUrl)}" target="_blank" rel="noreferrer">Open link</a>` : ""}
        </article>
      `
    )
    .join("");
};

const applyData = (data = {}) => {
  currentPartner = data.partner || null;
  currentMenu = Array.isArray(data.menuItems) ? data.menuItems : [];
  currentPosts = Array.isArray(data.posts) ? data.posts : [];
  currentChecklist = data.checklist || null;

  if (setupTitle && currentPartner) {
    setupTitle.textContent = currentPartner.restaurantName || "Restaurant";
  }
  if (setupMeta && currentPartner) {
    setupMeta.textContent = `${currentPartner.city || ""} · ${currentPartner.status || ""} · Setup ${currentChecklist?.completed || 0}/${currentChecklist?.total || 0} · Views ${Number(currentPartner.analyticsViews || 0)}`;
  }
  if (setupPublicLink && currentPartner?.slug) {
    setupPublicLink.href = `/restaurant/${encodeURIComponent(currentPartner.slug)}`;
    setupPublicLink.classList.remove("is-hidden");
  }

  renderChecklist();
  renderMenu();
  renderPosts();
};

const loadSetup = async () => {
  if (!partnerId || !email) {
    setStatus("Missing partnerId or email in URL.", true);
    return;
  }
  setStatus("Loading setup...");
  try {
    const res = await fetch(`/api/partners/${encodeURIComponent(partnerId)}/setup?email=${encodeURIComponent(email)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || "Could not load setup.", true);
      return;
    }
    applyData(data);
    setStatus("Setup loaded.");
  } catch {
    setStatus("Could not connect to server.", true);
  }
};

const addMenu = async () => {
  const itemName = String(menuName?.value || "").trim();
  const price = Number(menuPrice?.value || 0);
  if (!itemName || !Number.isFinite(price) || price <= 0) {
    setStatus("Provide valid menu item name and price.", true);
    return;
  }
  setStatus("Saving menu item...");
  try {
    const imageData = await readFileAsDataUrl(menuImage?.files?.[0]);
    const res = await fetch(`/api/partners/${encodeURIComponent(partnerId)}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, itemName, price, imageData, available: 1 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || "Could not add menu item.", true);
      return;
    }
    currentMenu = Array.isArray(data.menuItems) ? data.menuItems : currentMenu;
    currentChecklist = data.checklist || currentChecklist;
    menuName.value = "";
    menuPrice.value = "";
    if (menuImage) menuImage.value = "";
    renderMenu();
    renderChecklist();
    setStatus("Menu item added.");
  } catch {
    setStatus("Could not add menu item.", true);
  }
};

const toggleMenu = async (menuId, nextValue) => {
  setStatus("Updating availability...");
  try {
    const res = await fetch(`/api/partners/${encodeURIComponent(partnerId)}/menu/${encodeURIComponent(menuId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, available: Number(nextValue) ? 1 : 0 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || "Could not update availability.", true);
      return;
    }
    currentMenu = Array.isArray(data.menuItems) ? data.menuItems : currentMenu;
    currentChecklist = data.checklist || currentChecklist;
    renderMenu();
    renderChecklist();
    setStatus("Availability updated.");
  } catch {
    setStatus("Could not update availability.", true);
  }
};

const addPost = async () => {
  const title = String(postTitle?.value || "").trim();
  const body = String(postBody?.value || "").trim();
  const externalUrl = String(postUrl?.value || "").trim();
  if (!title || !body) {
    setStatus("Post title and body are required.", true);
    return;
  }
  setStatus("Publishing post...");
  try {
    const res = await fetch(`/api/partners/${encodeURIComponent(partnerId)}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, title, body, externalUrl, kind: "blog" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || "Could not publish post.", true);
      return;
    }
    currentPosts = Array.isArray(data.posts) ? data.posts : currentPosts;
    currentChecklist = data.checklist || currentChecklist;
    postTitle.value = "";
    postBody.value = "";
    postUrl.value = "";
    renderPosts();
    renderChecklist();
    setStatus("Post published.");
  } catch {
    setStatus("Could not publish post.", true);
  }
};

addMenuBtn?.addEventListener("click", addMenu);
addPostBtn?.addEventListener("click", addPost);
menuList?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-toggle-id]");
  if (!target) return;
  toggleMenu(target.dataset.toggleId || "", target.dataset.next || "1");
});

loadSetup();
