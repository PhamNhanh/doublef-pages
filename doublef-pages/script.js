import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const statusEl = document.getElementById("status");
const messagesEl = document.getElementById("messages");
const usernameEl = document.getElementById("username");
const messageEl = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

const firebaseConfig = {
  apiKey: "DAN_API_KEY_VAO_DAY",
  authDomain: "TEN_PROJECT.firebaseapp.com",
  databaseURL: "https://TEN_PROJECT-default-rtdb.firebaseio.com",
  projectId: "TEN_PROJECT",
  storageBucket: "TEN_PROJECT.appspot.com",
  messagingSenderId: "DAN_MESSAGING_SENDER_ID_VAO_DAY",
  appId: "DAN_APP_ID_VAO_DAY"
};

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text || "";
  return div.innerHTML;
}

function appendMessage(data) {
  const item = document.createElement("div");
  item.className = "message-item";
  item.innerHTML = `
    <div class="name">${escapeHtml(data.username)}</div>
    <div class="text">${escapeHtml(data.text)}</div>
    <div class="time">${escapeHtml(data.time)}</div>
  `;
  messagesEl.appendChild(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

try {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const messagesRef = ref(db, "messages");

  statusEl.textContent = "Đã kết nối";

  const savedName = localStorage.getItem("chat_username");
  if (savedName) {
    usernameEl.value = savedName;
  }

  function sendMessage() {
    const username = usernameEl.value.trim() || "Ẩn danh";
    const text = messageEl.value.trim();

    if (!text) return;

    localStorage.setItem("chat_username", username);

    push(messagesRef, {
      username: username,
      text: text,
      time: new Date().toLocaleString("vi-VN")
    })
      .then(() => {
        messageEl.value = "";
        messageEl.focus();
      })
      .catch((error) => {
        console.error(error);
        statusEl.textContent = "Lỗi gửi: " + error.message;
      });
  }

  sendBtn.addEventListener("click", sendMessage);

  messageEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  onChildAdded(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      appendMessage(data);
    },
    (error) => {
      console.error(error);
      statusEl.textContent = "Lỗi đọc: " + error.message;
    }
  );
} catch (error) {
  console.error(error);
  statusEl.textContent = "Lỗi kết nối: " + error.message;
}
