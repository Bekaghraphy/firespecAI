const chatBox = document.getElementById("chat");
const input = document.querySelector(".input-area input");
const sendBtn = document.querySelector(".input-area button");

// إضافة رسالة للشات
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerHTML = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// إرسال رسالة المستخدم
sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // رد مبدئي من السيستم (placeholder)
  setTimeout(() => {
    addMessage(
      "I will answer based on fire system standards once knowledge base is connected.",
      "assistant"
    );
  }, 600);
});

// إرسال بالـ Enter
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});