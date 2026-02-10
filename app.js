const chat = document.getElementById("chat");
const send = document.getElementById("send");
const msg = document.getElementById("msg");

const sessionId = localStorage.getItem("sid") || crypto.randomUUID();
localStorage.setItem("sid", sessionId);

send.onclick = async () => {
  const text = msg.value.trim();
  if (!text) return;

  chat.innerHTML += `<p><b>You:</b> ${text}</p>`;
  msg.value = "";

  const r = await fetch("https://YOUR-BACKEND/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, sessionId })
  });

  const data = await r.json();
  chat.innerHTML += `<p><b>Netfoodix AI:</b> ${data.reply}</p>`;
};
