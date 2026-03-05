const heroCover = document.getElementById("cover");
const logo = document.getElementById("logo");
const nameNode = document.getElementById("name");
const metaNode = document.getElementById("meta");
const summaryNode = document.getElementById("summary");
const menuNode = document.getElementById("menu");
const postsNode = document.getElementById("posts");

const formatCurrency = (value = 0) => `${Math.max(0, Number(value || 0)).toLocaleString()} TZS`;

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getInitialLetter = (value = "", fallback = "R") => {
  const raw = String(value || "").trim();
  const match = raw.match(/[a-z0-9]/i);
  return (match?.[0] || fallback || "R").toUpperCase();
};

const getSlug = () => {
  const path = window.location.pathname || "";
  const match = path.match(/\/restaurant\/([^/?#]+)/i);
  return decodeURIComponent(match?.[1] || "");
};

const renderMenu = (items = []) => {
  if (!menuNode) return;
  if (!items.length) {
    menuNode.innerHTML = '<div class="empty">Menu setup in progress.</div>';
    return;
  }
  menuNode.innerHTML = items
    .map(
      (item) => `
        <article class="menu-item">
          <div class="menu-item-head">
            <strong>${escapeHtml(item.itemName || "Menu item")}</strong>
            <strong>${formatCurrency(item.price || 0)}</strong>
          </div>
          ${item.imageData ? `<img src="${escapeHtml(item.imageData)}" alt="${escapeHtml(item.itemName || "Menu item")}" />` : ""}
        </article>
      `
    )
    .join("");
};

const renderPosts = (posts = []) => {
  if (!postsNode) return;
  if (!posts.length) {
    postsNode.innerHTML = '<div class="empty">No blogs/updates published yet.</div>';
    return;
  }
  postsNode.innerHTML = posts
    .map(
      (post) => `
        <article class="post-item">
          <strong>${escapeHtml(post.title || "Update")}</strong>
          <p>${escapeHtml(post.body || "")}</p>
          <div class="muted">${escapeHtml(post.createdAt || "")}</div>
          ${post.externalUrl ? `<a href="${escapeHtml(post.externalUrl)}" target="_blank" rel="noreferrer">Open link</a>` : ""}
        </article>
      `
    )
    .join("");
};

const loadPage = async () => {
  const slug = getSlug();
  if (!slug) {
    nameNode.textContent = "Restaurant page not found";
    return;
  }
  try {
    const res = await fetch(`/api/partners/public/${encodeURIComponent(slug)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      nameNode.textContent = data.error || "Restaurant not found";
      return;
    }
    const partner = data.partner || {};
    const restaurantName = partner.restaurantName || "Restaurant";
    const initial = getInitialLetter(restaurantName, "R");
    nameNode.textContent = restaurantName;
    metaNode.textContent = `${partner.city || "City"} · ${partner.priceTier || "Mid-range"} · ${partner.hours || ""}`;
    summaryNode.textContent = `Signature dish: ${partner.signatureDish || "N/A"} · ${formatCurrency(partner.signaturePrice || 0)}`;
    if (logo) {
      logo.textContent = initial;
      if (partner.logoData) {
        const safeLogo = String(partner.logoData).replace(/"/g, '\\"');
        logo.classList.add("has-image");
        logo.style.setProperty("--logo-image", `url("${safeLogo}")`);
        logo.setAttribute("aria-label", `${restaurantName} logo`);
      } else {
        logo.classList.remove("has-image");
        logo.style.removeProperty("--logo-image");
        logo.setAttribute("aria-label", `${restaurantName} avatar ${initial}`);
      }
    }
    if (partner.coverData) heroCover.style.backgroundImage = `url('${partner.coverData}')`;
    renderMenu(Array.isArray(data.menuItems) ? data.menuItems : []);
    renderPosts(Array.isArray(data.posts) ? data.posts : []);
  } catch {
    nameNode.textContent = "Could not load restaurant page";
  }
};

loadPage();
