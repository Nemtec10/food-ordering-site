const adminKeyInput = document.getElementById("adminKeyInput");
const loadBtn = document.getElementById("loadBtn");
const adminStatus = document.getElementById("adminStatus");
const searchInput = document.getElementById("searchInput");
const adminList = document.getElementById("adminList");
const reviewPanel = document.getElementById("reviewPanel");
const reviewInfo = document.getElementById("reviewInfo");
const reviewMessage = document.getElementById("reviewMessage");
const rejectReason = document.getElementById("rejectReason");
const approveBtn = document.getElementById("approveBtn");
const rejectBtn = document.getElementById("rejectBtn");
const reviewStatus = document.getElementById("reviewStatus");
const reviewLinks = document.getElementById("reviewLinks");
const publicUrlLink = document.getElementById("publicUrlLink");
const setupUrlLink = document.getElementById("setupUrlLink");
const refreshEarningsBtn = document.getElementById("refreshEarningsBtn");
const earningsSummary = document.getElementById("earningsSummary");
const earningsList = document.getElementById("earningsList");
const tabs = Array.from(document.querySelectorAll(".tab"));

let activeStatus = "pending_review";
let rows = [];
let selected = null;
let earningsRows = [];
let recentPayments = [];

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const setStatus = (text = "", isError = false) => {
  if (!adminStatus) return;
  adminStatus.textContent = text;
  adminStatus.style.color = isError ? "#ff9eb1" : "#9fe8d2";
};

const setReviewStatus = (text = "", isError = false) => {
  if (!reviewStatus) return;
  reviewStatus.textContent = text;
  reviewStatus.style.color = isError ? "#ff9eb1" : "#9fe8d2";
};

const setEarningsStatus = (text = "", isError = false) => {
  if (!earningsSummary) return;
  earningsSummary.textContent = text;
  earningsSummary.style.color = isError ? "#ff9eb1" : "#9fe8d2";
};

const getAdminHeaders = () => ({
  "Content-Type": "application/json",
  "x-admin-key": String(adminKeyInput?.value || "").trim(),
});

const formatMoney = (value = 0) => `${Math.max(0, Number(value || 0)).toLocaleString()} TZS`;

const paymentMethodLabel = (method = "") => {
  const key = String(method || "").toLowerCase();
  if (key === "mobile-money") return "Mobile Money";
  if (key === "cash") return "Cash on Delivery";
  return "Card";
};

const renderList = () => {
  if (!adminList) return;
  const needle = String(searchInput?.value || "").toLowerCase().trim();
  const filtered = rows.filter((row) =>
    [row.restaurantName, row.ownerName, row.email, row.city, row.status]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );

  if (!filtered.length) {
    adminList.innerHTML = `<div class="item"><div class="meta">No registrations found for this filter.</div></div>`;
    return;
  }

  adminList.innerHTML = filtered
    .map(
      (row) => `
        <article class="item">
          <div class="item-head">
            <strong>${escapeHtml(row.restaurantName)}</strong>
            <span class="badge">${escapeHtml(row.status)}</span>
          </div>
          <div class="meta">${escapeHtml(row.city)} · ${escapeHtml(row.ownerName)} · ${escapeHtml(row.email)}</div>
          <div class="meta">Created: ${escapeHtml(row.createdAt || "")}</div>
          <div class="row">
            <button type="button" data-open="${escapeHtml(row.id)}">Open Review</button>
          </div>
        </article>
      `
    )
    .join("");
};

const applyReviewPartner = (partner = {}, checklist = null) => {
  selected = partner;
  if (!reviewPanel || !reviewInfo) return;
  reviewPanel.classList.remove("is-hidden");
  reviewLinks.classList.add("is-hidden");
  reviewInfo.innerHTML = `
    <strong>${escapeHtml(partner.restaurantName || "")}</strong><br />
    Owner: ${escapeHtml(partner.ownerName || "")}<br />
    Email: ${escapeHtml(partner.email || "")}<br />
    City: ${escapeHtml(partner.city || "")}<br />
    Status: ${escapeHtml(partner.status || "")}<br />
    ${partner.rejectionReason ? `Rejection reason: ${escapeHtml(partner.rejectionReason)}<br />` : ""}
    ${checklist ? `Setup progress: ${escapeHtml(`${checklist.completed}/${checklist.total}`)}` : ""}
  `;
};

const fetchPartners = async () => {
  setStatus("Loading...");
  try {
    const res = await fetch(`/api/admin/partners?status=${encodeURIComponent(activeStatus)}`, {
      headers: getAdminHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      rows = [];
      renderList();
      setStatus(data.error || "Failed to load registrations.", true);
      return;
    }
    rows = Array.isArray(data.partners) ? data.partners : [];
    renderList();
    setStatus(`Loaded ${rows.length} registration(s).`);
  } catch {
    setStatus("Could not connect to server.", true);
  }
};

const openPartner = async (id = "") => {
  if (!id) return;
  setReviewStatus("Loading details...");
  try {
    const res = await fetch(`/api/admin/partners/${encodeURIComponent(id)}`, {
      headers: getAdminHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReviewStatus(data.error || "Failed to load partner.", true);
      return;
    }
    applyReviewPartner(data.partner, data.checklist);
    setReviewStatus("Ready for review.");
  } catch {
    setReviewStatus("Could not load partner.", true);
  }
};

const renderEarnings = () => {
  if (!earningsList) return;
  if (!earningsRows.length) {
    earningsList.innerHTML = `<div class="item"><div class="meta">No payment records yet.</div></div>`;
    return;
  }

  earningsList.innerHTML = earningsRows
    .map((row) => {
      const restaurantRef = String(row.restaurantRef || "");
      const payments = recentPayments
        .filter((payment) => String(payment.restaurantRef || "") === restaurantRef)
        .slice(0, 3);
      const paymentLines = payments.length
        ? `
          <div class="earnings-payments">
            ${payments
              .map(
                (payment) => `
                  <small>
                    #${escapeHtml(payment.orderId || "-")} · ${escapeHtml(paymentMethodLabel(payment.method))} ·
                    ${escapeHtml(formatMoney(payment.total || 0))} · ${escapeHtml(payment.createdAt || "")}
                  </small>
                `
              )
              .join("")}
          </div>
        `
        : `<div class="earnings-payments"><small>No recent transactions for this restaurant.</small></div>`;

      return `
        <article class="item">
          <div class="item-head">
            <strong>${escapeHtml(row.restaurantName || "Restaurant")}</strong>
            <span class="badge">${escapeHtml(formatMoney(row.totalReceived || 0))}</span>
          </div>
          <div class="earnings-breakdown">
            <div class="earnings-row">
              <span>Payments</span>
              <strong>${escapeHtml(String(row.paymentsCount || 0))}</strong>
            </div>
            <div class="earnings-row">
              <span>Last method</span>
              <strong>${escapeHtml(paymentMethodLabel(row.lastMethod))}</strong>
            </div>
            <div class="earnings-row">
              <span>Updated</span>
              <strong>${escapeHtml(String(row.updatedAt || "-"))}</strong>
            </div>
          </div>
          ${paymentLines}
        </article>
      `;
    })
    .join("");
};

const fetchEarnings = async () => {
  setEarningsStatus("Loading earnings...");
  try {
    const res = await fetch("/api/admin/earnings", {
      headers: getAdminHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      earningsRows = [];
      recentPayments = [];
      renderEarnings();
      setEarningsStatus(data.error || "Failed to load earnings.", true);
      return;
    }

    earningsRows = Array.isArray(data.restaurants) ? data.restaurants : [];
    recentPayments = Array.isArray(data.recentPayments) ? data.recentPayments : [];
    renderEarnings();
    const total = earningsRows.reduce((sum, row) => sum + Math.max(0, Number(row.totalReceived || 0)), 0);
    setEarningsStatus(
      `Loaded ${earningsRows.length} restaurant wallet(s). Total received: ${formatMoney(total)}.`
    );
  } catch {
    setEarningsStatus("Could not connect to server.", true);
  }
};

const loadDashboard = async () => {
  await Promise.all([fetchPartners(), fetchEarnings()]);
};

const review = async (action = "approve") => {
  if (!selected?.id) {
    setReviewStatus("Open a registration first.", true);
    return;
  }
  const body = {
    action,
    reviewMessage: String(reviewMessage?.value || "").trim(),
    rejectionReason: String(rejectReason?.value || "").trim(),
  };
  if (action === "reject" && !body.rejectionReason) {
    setReviewStatus("Rejection reason is required.", true);
    return;
  }
  setReviewStatus("Saving review...");
  try {
    const res = await fetch(`/api/admin/partners/${encodeURIComponent(selected.id)}/review`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReviewStatus(data.error || "Review action failed.", true);
      return;
    }

    if (data.publicUrl && data.setupUrl) {
      reviewLinks.classList.remove("is-hidden");
      publicUrlLink.href = data.publicUrl;
      setupUrlLink.href = data.setupUrl;
    }
    setReviewStatus(`Restaurant ${action === "approve" ? "approved" : "rejected"} successfully.`);
    await Promise.all([fetchPartners(), fetchEarnings()]);
  } catch {
    setReviewStatus("Could not complete review.", true);
  }
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");
    activeStatus = tab.dataset.status || "pending_review";
    fetchPartners();
  });
});

loadBtn?.addEventListener("click", loadDashboard);
searchInput?.addEventListener("input", renderList);
adminList?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-open]");
  if (!target) return;
  openPartner(target.dataset.open || "");
});
approveBtn?.addEventListener("click", () => review("approve"));
rejectBtn?.addEventListener("click", () => review("reject"));
refreshEarningsBtn?.addEventListener("click", fetchEarnings);