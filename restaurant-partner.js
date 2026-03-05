const form = document.getElementById("partnerForm");
const formStatus = document.getElementById("formStatus");
const ADMIN_KEY = ""; // you can change this value for testing purposes, but make sure to set it back before deployment
const resetBtn = document.getElementById("resetBtn");
const updatesFeed = document.getElementById("updatesFeed");
const profilePreview = document.getElementById("profilePreview");
const feedSearch = document.getElementById("feedSearch");
const refreshFeedBtn = document.getElementById("refreshFeedBtn");
const statusEmail = document.getElementById("statusEmail");
const checkStatusBtn = document.getElementById("checkStatusBtn");
const statusResult = document.getElementById("statusResult");
const statusActions = document.getElementById("statusActions");
const setupLink = document.getElementById("setupLink");
const publicLink = document.getElementById("publicLink");
const checklistList = document.getElementById("checklistList");

document.getElementById("loadRegistrationsBtn").addEventListener("click", () => {
  const entered = document.getElementById("adminKeyInput").value.trim();

  if (entered !== ADMIN_KEY) {
    alert("Admin access denied");
    return;
  }

  loadRegistrations(); // your existing function
});
restaurant.status = "approved";
localStorage.setItem("restaurants", JSON.stringify(restaurants));
const fields = {
  restaurantName: document.getElementById("restaurantName"),
  ownerName: document.getElementById("ownerName"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  city: document.getElementById("city"),
  address: document.getElementById("address"),
  priceTier: document.getElementById("priceTier"),
  hours: document.getElementById("hours"),
  signatureDish: document.getElementById("signatureDish"),
  signaturePrice: document.getElementById("signaturePrice"),
  logoFile: document.getElementById("logoFile"),
  coverFile: document.getElementById("coverFile"),
  updateTitle: document.getElementById("updateTitle"),
  updateDate: document.getElementById("updateDate"),
  updateBody: document.getElementById("updateBody"),
  blogUrl: document.getElementById("blogUrl"),
};

let feedRows = [];
let trackedPartner = null;

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDate = (value = "") => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatCurrency = (value = 0) => `${Math.max(0, Number(value || 0)).toLocaleString()} TZS`;

const getInitialLetter = (value = "", fallback = "R") => {
  const raw = String(value || "").trim();
  const match = raw.match(/[a-z0-9]/i);
  return (match?.[0] || fallback || "R").toUpperCase();
};

const renderPreviewLogo = (restaurantName = "", logoData = "") => {
  if (logoData) {
    return `<img class="preview-logo preview-logo-image" src="${escapeHtml(logoData)}" alt="Restaurant logo" />`;
  }
  const initial = getInitialLetter(restaurantName, "R");
  return `<div class="preview-logo preview-logo-fallback" role="img" aria-label="Restaurant avatar ${escapeHtml(initial)}">${escapeHtml(initial)}</div>`;
};

const setTodayAsDefault = () => {
  if (!fields.updateDate || fields.updateDate.value) return;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  fields.updateDate.value = `${yyyy}-${mm}-${dd}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsDataURL(file);
  });

const getCheckedValues = (name) =>
  Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);

const getFormDraft = () => ({
  restaurantName: String(fields.restaurantName?.value || "").trim(),
  ownerName: String(fields.ownerName?.value || "").trim(),
  email: String(fields.email?.value || "").trim().toLowerCase(),
  phone: String(fields.phone?.value || "").trim(),
  city: String(fields.city?.value || "").trim(),
  address: String(fields.address?.value || "").trim(),
  priceTier: String(fields.priceTier?.value || "Mid-range"),
  hours: String(fields.hours?.value || "").trim(),
  signatureDish: String(fields.signatureDish?.value || "").trim(),
  signaturePrice: Number(fields.signaturePrice?.value || 0),
  cuisines: getCheckedValues("cuisine"),
  services: getCheckedValues("service"),
  updateTitle: String(fields.updateTitle?.value || "").trim(),
  updateDate: String(fields.updateDate?.value || "").trim(),
  updateBody: String(fields.updateBody?.value || "").trim(),
  blogUrl: String(fields.blogUrl?.value || "").trim(),
});

const setFormStatus = (text = "", isError = false) => {
  if (!formStatus) return;
  formStatus.textContent = text;
  formStatus.style.color = isError ? "#ff9eb1" : "#9fe8d1";
};

const setStatusResult = (text = "", isError = false) => {
  if (!statusResult) return;
  statusResult.textContent = text;
  statusResult.style.color = isError ? "#ff9eb1" : "#9fe8d1";
};

const renderPreview = (data = {}, images = {}) => {
  if (!profilePreview) return;
  const logo = renderPreviewLogo(data.restaurantName || "", images.logoData || "");
  const cover = images.coverData || "";
  const cuisines = (data.cuisines || []).map((v) => `<span class="mini-chip">${escapeHtml(v)}</span>`).join("");
  const services = (data.services || []).map((v) => `<span class="mini-chip">${escapeHtml(v)}</span>`).join("");
  profilePreview.innerHTML = `
    <div class="preview-cover" style="${cover ? `background-image:url('${cover}')` : ""}"></div>
    <div class="preview-body">
      <div class="preview-profile">
        ${logo}
        <div>
          <div class="preview-name">${escapeHtml(data.restaurantName || "Restaurant name")}</div>
          <div class="preview-sub">${escapeHtml(data.city || "City")} · ${escapeHtml(data.priceTier || "Mid-range")}</div>
        </div>
      </div>
      <div class="preview-sub">${escapeHtml(data.address || "Address not set")}<br />${escapeHtml(data.hours || "Opening hours not set")}</div>
      <div class="mini-chip-wrap">${cuisines || '<span class="mini-chip">Cuisine tags</span>'}</div>
      <div class="mini-chip-wrap">${services || '<span class="mini-chip">Service tags</span>'}</div>
      <div class="update-box">
        <h4>${escapeHtml(data.updateTitle || "Latest update title")}</h4>
        <p>${escapeHtml(data.updateBody || "Latest services/blog summary appears here.")}</p>
      </div>
      <div class="preview-sub">Signature: ${escapeHtml(data.signatureDish || "Dish")} · ${formatCurrency(data.signaturePrice || 0)}</div>
    </div>
  `;
};

const applyChecklist = (checklist = null) => {
  if (!checklistList) return;
  checklistList.innerHTML = "";
  if (!checklist || !Array.isArray(checklist.checks)) return;
  const summary = document.createElement("li");
  summary.textContent = `Setup progress: ${checklist.completed}/${checklist.total}`;
  checklistList.appendChild(summary);

  for (const item of checklist.checks) {
    const li = document.createElement("li");
    li.className = item.done ? "done" : "todo";
    li.textContent = `${item.done ? "✓" : "•"} ${item.label}`;
    checklistList.appendChild(li);
  }
};

const applyTrackedStatus = (payload = {}) => {
  const partner = payload.partner || null;
  const checklist = payload.checklist || null;
  trackedPartner = partner;

  if (!partner) {
    setStatusResult("No registration found.", true);
    statusActions?.classList.add("is-hidden");
    applyChecklist(null);
    return;
  }

  const statusText =
    partner.status === "approved"
      ? "Approved"
      : partner.status === "rejected"
        ? "Rejected"
        : "Pending review";
  const reason = partner.rejectionReason ? ` Reason: ${partner.rejectionReason}` : "";
  const reviewMessage = partner.reviewMessage ? ` Admin message: ${partner.reviewMessage}` : "";
  setStatusResult(`Status: ${statusText}.${reason}${reviewMessage}`);

  const setupUrl = `/restaurant-setup.html?partnerId=${encodeURIComponent(partner.id)}&email=${encodeURIComponent(partner.email)}`;
  if (setupLink) setupLink.href = setupUrl;
  if (publicLink) publicLink.href = payload.publicUrl || `/restaurant/${partner.slug}`;

  if (partner.status === "approved") {
    statusActions?.classList.remove("is-hidden");
  } else {
    statusActions?.classList.add("is-hidden");
  }

  applyChecklist(checklist);
};

const checkRegistrationStatus = async (email = "") => {
  const target = String(email || statusEmail?.value || "").trim().toLowerCase();
  if (!target) {
    setStatusResult("Enter an email to track status.", true);
    return;
  }
  setStatusResult("Checking status...");
  try {
    const res = await fetch(`/api/partners/status?email=${encodeURIComponent(target)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      applyTrackedStatus(null);
      setStatusResult(data.error || "Could not load status.", true);
      return;
    }
    applyTrackedStatus(data);
  } catch {
    setStatusResult("Could not connect to server.", true);
  }
};

const buildFeedCard = (row = {}) => `
  <article class="feed-card">
    <div class="feed-card-head">
      <div>
        <h4>${escapeHtml(row.restaurantName || "Restaurant")}</h4>
        <div class="feed-meta">${escapeHtml(row.city || "City")} · ${escapeHtml(row.priceTier || "Mid-range")} · ${formatDate(row.updatedAt)}</div>
      </div>
      <span class="chip">${formatCurrency(row.signaturePrice || 0)}</span>
    </div>
    <div class="feed-content">
      <strong>${escapeHtml(row.latestTitle || "Latest update")}</strong><br />
      ${escapeHtml(row.latestBody || "No update summary yet.")}
    </div>
    <div class="feed-meta">Signature dish: ${escapeHtml(row.signatureDish || "N/A")}</div>
    <a class="feed-link" href="/restaurant/${encodeURIComponent(row.slug || "")}" target="_blank" rel="noreferrer">Open restaurant page</a>
  </article>
`;

const renderFeed = (query = "") => {
  if (!updatesFeed) return;
  const needle = String(query || "").trim().toLowerCase();
  const rows = feedRows.filter((row) => {
    if (!needle) return true;
    return [
      row.restaurantName,
      row.city,
      row.latestTitle,
      row.latestBody,
      row.signatureDish,
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  if (!rows.length) {
    updatesFeed.innerHTML = '<div class="empty">No approved restaurants yet. Pending ones appear after admin approval.</div>';
    return;
  }
  updatesFeed.innerHTML = rows.map(buildFeedCard).join("");
};

const loadPublicFeed = async () => {
  try {
    const res = await fetch("/api/partners/public");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load feed.");
    feedRows = Array.isArray(data.partners) ? data.partners : [];
    renderFeed(feedSearch?.value || "");
  } catch {
    updatesFeed.innerHTML = '<div class="empty">Could not load updates feed right now.</div>';
  }
};

const submitRegistration = async (event) => {
  event.preventDefault();
  const draft = getFormDraft();
  if (!draft.email) {
    setFormStatus("Email is required.", true);
    return;
  }

  setFormStatus("Submitting...");
  const statusBefore = trackedPartner?.status || "";
  const sameEmail = String(trackedPartner?.email || "").toLowerCase() === draft.email;

  try {
    const logoData = await readFileAsDataUrl(fields.logoFile?.files?.[0]);
    const coverData = await readFileAsDataUrl(fields.coverFile?.files?.[0]);
    const payload = {
      ...draft,
      logoData: logoData || undefined,
      coverData: coverData || undefined,
    };

    let endpoint = "/api/partners/register";
    let method = "POST";
    if (trackedPartner?.id && statusBefore === "rejected" && sameEmail) {
      endpoint = `/api/partners/${encodeURIComponent(trackedPartner.id)}/resubmit`;
      method = "PUT";
    }

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFormStatus(data.error || "Submission failed.", true);
      return;
    }

    const okMessage =
      method === "PUT"
        ? "Resubmitted successfully. Waiting for admin review."
        : "Submitted successfully. Status set to pending review.";
    setFormStatus(okMessage);
    statusEmail.value = draft.email;
    await checkRegistrationStatus(draft.email);
    await loadPublicFeed();
  } catch {
    setFormStatus("Could not send registration to server.", true);
  }
};

const resetForm = () => {
  form?.reset();
  setTodayAsDefault();
  renderPreview(getFormDraft(), {});
  setFormStatus("Form cleared.");
};

form?.addEventListener("submit", submitRegistration);
form?.addEventListener("input", () => renderPreview(getFormDraft(), {}));
form?.addEventListener("change", () => renderPreview(getFormDraft(), {}));
resetBtn?.addEventListener("click", resetForm);
checkStatusBtn?.addEventListener("click", () => checkRegistrationStatus());
feedSearch?.addEventListener("input", () => renderFeed(feedSearch.value || ""));
refreshFeedBtn?.addEventListener("click", () => loadPublicFeed());

setTodayAsDefault();
renderPreview(getFormDraft(), {});
loadPublicFeed();
