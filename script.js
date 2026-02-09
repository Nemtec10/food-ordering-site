/* =========================
   UI: theme + cart + toasts
========================= */

const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const toastHost = document.getElementById("toastHost");

const menuGrid = document.getElementById("menuGrid");
const cart = new Map(); // name -> {price, qty}

/** Load theme */
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") root.classList.add("light");
themeBtn.textContent = root.classList.contains("light") ? "🌞" : "🌙";

themeBtn.addEventListener("click", () => {
  root.classList.toggle("light");
  const isLight = root.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeBtn.textContent = isLight ? "🌞" : "🌙";
  toast(isLight ? "Light mode on" : "Dark mode on");
});

cartBtn.addEventListener("click", () => openCart(true));
closeCart.addEventListener("click", () => openCart(false));

function openCart(open) {
  cartDrawer.classList.toggle("open", open);
  cartDrawer.setAttribute("aria-hidden", String(!open));
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  toastHost.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/** Add to cart (event delegation) */
menuGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".addBtn");
  if (!btn) return;

  const card = btn.closest(".card");
  const name = card.dataset.name;
  const price = Number(card.dataset.price);

  const item = cart.get(name) || { price, qty: 0 };
  item.qty += 1;
  cart.set(name, item);

  renderCart();
  toast(`Added: ${name}`);
});

function renderCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;
  let count = 0;

  for (const [name, item] of cart.entries()) {
    total += item.price * item.qty;
    count += item.qty;

    const line = document.createElement("div");
    line.className = "cart-line";
    line.innerHTML = `
      <div>
        <strong>${name}</strong><br/>
        <span class="muted">$${item.price.toFixed(2)}</span>
      </div>
      <div class="qty">
        <button class="btn ghost" data-action="dec" data-name="${name}">−</button>
        <strong>${item.qty}</strong>
        <button class="btn ghost" data-action="inc" data-name="${name}">+</button>
      </div>
    `;
    cartItemsEl.appendChild(line);
  }

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  cartCountEl.textContent = String(count);

  if (count === 0) {
    cartItemsEl.innerHTML = `<p class="muted">Your cart is empty. Add some items 😊</p>`;
  }
}

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const name = btn.dataset.name;
  const item = cart.get(name);
  if (!item) return;

  if (action === "inc") item.qty += 1;
  if (action === "dec") item.qty -= 1;

  if (item.qty <= 0) cart.delete(name);
  else cart.set(name, item);

  renderCart();
});

/* =========================
   AI Companion (two options)
   1) Offline FAQ mode (works without server)
   2) Real AI via API (needs backend)
========================= */

const aiFab = document.getElementById("aiFab");
const aiWidget = document.getElementById("aiWidget");
const aiClose = document.getElementById("aiClose");
const aiChat = document.getElementById("aiChat");
const aiForm = document.getElementById("aiForm");
const aiInput = document.getElementById("aiInput");

aiFab.addEventListener("click", () => toggleAI(true));
aiClose.addEventListener("click", () => toggleAI(false));

function toggleAI(open) {
  aiWidget.classList.toggle("open", open);
  aiWidget.setAttribute("aria-hidden", String(!open));
  if (open) aiInput.focus();
}

function addBubble(text, who = "bot") {
  const b = document.createElement("div");
  b.className = `bubble ${who}`;
  b.textContent = text;
  aiChat.appendChild(b);
  aiChat.scrollTop = aiChat.scrollHeight;
}

addBubble("Hi! I’m your AI companion. Ask me about the menu, cart, checkout, or delivery 🙂", "bot");

/* ---- Option A: Offline FAQ (no internet) ---- */
function offlineAnswer(q) {
  const question = q.toLowerCase();

  // You can customize these answers for your site:
  if (question.includes("how") && question.includes("order")) {
    return "To order: click Add on a meal → open Cart → adjust quantity → press Checkout.";
  }
  if (question.includes("delivery") || question.includes("deliver")) {
    return "Delivery times depend on your location. In this demo, delivery tracking would appear after checkout.";
  }
  if (question.includes("payment") || question.includes("pay")) {
    return "Payments: you can add Mobile Money / Card / Cash on delivery options in your checkout page.";
  }
  if (question.includes("cart")) {
    return "Your cart button is on the top right. You can increase (+) or decrease (−) items inside it.";
  }
  if (question.includes("dark") || question.includes("light") || question.includes("theme")) {
    return "Use the 🌙/🌞 button in the top bar to toggle dark/light mode.";
  }
  return "I can help with: ordering steps, cart, checkout, delivery, payments, and theme. What are you trying to do?";
}

/* ---- Option B: Real AI (requires backend proxy) ----
   You MUST NOT put your API key in frontend JS.
   Instead: create /api/chat on your server and call it from here.
*/
async function realAIAnswer(userText) {
  // Example call to your backend:
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userText,
      // You can also send page context to help the AI:
      context: getPageContext(),
    }),
  });

  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.reply; // your server should return { reply: "..." }
}

function getPageContext() {
  // Basic “knowledge” about the page for AI
  const items = [...document.querySelectorAll(".card")].map((c) => ({
    name: c.dataset.name,
    price: Number(c.dataset.price),
  }));

  const cartState = [...cart.entries()].map(([name, item]) => ({
    name,
    qty: item.qty,
    price: item.price,
  }));

  return {
    appName: "Noel Eats",
    menuItems: items,
    cart: cartState,
    total: cartTotalEl.textContent,
  };
}

aiForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = aiInput.value.trim();
  if (!text) return;

  addBubble(text, "user");
  aiInput.value = "";

  // Choose which mode you want:
  const USE_REAL_AI = false; // set true when your backend is ready

  try {
    addBubble("Thinking...", "bot");
    const lastBotBubble = aiChat.lastChild;

    let reply;
    if (USE_REAL_AI) reply = await realAIAnswer(text);
    else reply = offlineAnswer(text);

    lastBotBubble.textContent = reply;
  } catch (err) {
    addBubble("Sorry—AI is unavailable right now. (Tip: use Offline mode or check your server endpoint.)", "bot");
  }
});

/* Initial render */
renderCart();
