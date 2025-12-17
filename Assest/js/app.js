// FireSpec AI - UI + Language Toggle + Knowledge Lookup + View Source

const app = document.getElementById("app");
const chat = document.getElementById("chat");
const langToggle = document.getElementById("langToggle");

const appName = document.getElementById("appName");
const tagline = document.getElementById("tagline");

const scopeTitle = document.getElementById("scopeTitle");
const scopeHint = document.getElementById("scopeHint");
const scopeBadge = document.getElementById("scopeBadge");

const welcomeMsg = document.getElementById("welcomeMsg");

const chip1 = document.getElementById("chip1");
const chip2 = document.getElementById("chip2");
const chip3 = document.getElementById("chip3");
const chip4 = document.getElementById("chip4");

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const sendTxt = document.getElementById("sendTxt");
const safetyNote = document.getElementById("safetyNote");

const tabEgypt = document.getElementById("scope-egypt");
const tabSaudi = document.getElementById("scope-saudi");
const tabInternational = document.getElementById("scope-international");

let currentScope = "egypt";
let currentLang = "en";
let translations = null;
let knowledgeBase = [];

// ---------- helpers ----------
function scrollToBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function setActiveTab(scope) {
  const tabs = document.querySelectorAll(".scopeTabs .tab");
  tabs.forEach(t => {
    const isActive = t.dataset.scope === scope;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function setScope(scope) {
  currentScope = scope;
  app.setAttribute("data-scope", scope);
  setActiveTab(scope);

  const map = {
    egypt: { badge: "EGYPT" },
    saudi: { badge: "SAUDI" },
    international: { badge: "INTL" }
  };
  scopeBadge.textContent = map[scope].badge;

  // also refresh placeholders / text
  if (translations) applyLanguage();
}

function makeMsg({ type, text, source }) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${type === "user" ? "msg--user" : "msg--ai"}`;

  const meta = document.createElement("div");
  meta.className = "msg__meta";

  const b1 = document.createElement("span");
  b1.className = "badge";
  b1.textContent = type === "user" ? (currentLang === "ar" ? "أنت" : "You") : "FireSpec AI";

  const b2 = document.createElement("span");
  b2.className = "badge";
  b2.textContent = (currentScope || "").toUpperCase();

  meta.appendChild(b1);
  meta.appendChild(b2);

  const bubble = document.createElement("div");
  bubble.className = "msg__bubble";
  bubble.innerHTML = text;

  wrap.appendChild(meta);
  wrap.appendChild(bubble);

  if (source) {
    const row = document.createElement("div");
    row.className = "sourceRow";

    const btn = document.createElement("button");
    btn.className = "sourceBtn";
    btn.type = "button";
    btn.innerHTML = `<strong>View Source</strong> · ${source.label}`;

    btn.addEventListener("click", () => {
      if (source.url) window.open(source.url, "_blank", "noopener,noreferrer");
      else alert(currentLang === "ar" ? "لا يوجد رابط مصدر مرفق لهذا المرجع." : "No source URL attached for this reference.");
    });

    row.appendChild(btn);
    wrap.appendChild(row);
  }

  chat.appendChild(wrap);
  scrollToBottom();
}

function addTyping() {
  const wrap = document.createElement("div");
  wrap.className = "msg msg--ai";
  wrap.id = "typingMsg";

  const meta = document.createElement("div");
  meta.className = "msg__meta";
  meta.innerHTML = `<span class="badge badge--ai">FireSpec AI</span><span class="badge">${(currentScope||"").toUpperCase()}</span>`;

  const bubble = document.createElement("div");
  bubble.className = "msg__bubble";
  bubble.innerHTML = `<span class="typing"><span class="dotty"></span><span class="dotty"></span><span class="dotty"></span></span>`;

  wrap.appendChild(meta);
  wrap.appendChild(bubble);
  chat.appendChild(wrap);
  scrollToBottom();
}

function removeTyping() {
  const t = document.getElementById("typingMsg");
  if (t) t.remove();
}

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function matchScore(q, item) {
  // score by keyword hits
  let score = 0;
  const qn = normalize(q);

  for (const k of item.keywords || []) {
    const kn = normalize(k);
    if (!kn) continue;
    if (qn.includes(kn)) score += 3;
  }

  // small bonus if system mentioned
  if (item.system && qn.includes(normalize(item.system))) score += 1;

  return score;
}

function findBestAnswer(question) {
  const scoped = knowledgeBase.filter(x => x.scope === currentScope);
  let best = null;
  let bestScore = 0;

  for (const item of scoped) {
    const s = matchScore(question, item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }
  // threshold
  return bestScore >= 2 ? best : null;
}

// ---------- language ----------
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

function applyLanguage() {
  const t = translations[currentLang];
  if (!t) return;

  document.documentElement.lang = currentLang;
  document.documentElement.dir = t.direction;

  appName.innerHTML = t.app_name;
  tagline.textContent = t.tagline;

  scopeTitle.textContent = t.scope_title;
  scopeHint.textContent = t.scope_hint;

  // tabs
  tabEgypt.querySelector(".tab__txt").textContent = t.scopes.egypt;
  tabSaudi.querySelector(".tab__txt").textContent = t.scopes.saudi;
  tabInternational.querySelector(".tab__txt").textContent = t.scopes.international;

  // chips
  chip1.textContent = t.chips.fire_alarm;
  chip2.textContent = t.chips.sprinklers;
  chip3.textContent = t.chips.pumps;
  chip4.textContent = t.chips.commissioning;

  // welcome + input
  welcomeMsg.textContent = t.welcome;
  userInput.placeholder = t.placeholder;
  sendTxt.textContent = t.send;
  safetyNote.textContent = t.safety_note;

  // toggle label
  langToggle.textContent = currentLang === "en" ? "AR" : "EN";
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "ar" : "en";
  applyLanguage();
}

// ---------- events ----------
document.querySelectorAll(".scopeTabs .tab").forEach(btn => {
  btn.addEventListener("click", () => setScope(btn.dataset.scope));
});

langToggle.addEventListener("click", toggleLanguage);

sendBtn.addEventListener("click", onSend);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onSend();
});

function onSend() {
  const q = userInput.value.trim();
  if (!q) return;

  makeMsg({ type: "user", text: escapeHTML(q) });
  userInput.value = "";

  addTyping();

  setTimeout(() => {
    const found = findBestAnswer(q);

    removeTyping();

    if (!found) {
      makeMsg({
        type: "ai",
        text: (currentLang === "ar")
          ? "مش لاقي مرجع مطابق داخل النطاق المختار. جرّب كلمات أوضح مثل: كاشف دخان، مضخة حريق، رشاشات…"
          : "No matching reference found in the selected scope. Try clearer keywords like: smoke detector, fire pump, sprinklers…"
      });
      return;
    }

    const answer = currentLang === "ar" ? found.answer_ar : found.answer_en;

    const sourceLabel = `${found.source} • ${found.reference}`;
    const sourceUrl = found.source_url || ""; // optional

    makeMsg({
      type: "ai",
      text: `${escapeHTML(answer)}`,
      source: { label: sourceLabel, url: sourceUrl }
    });
  }, 700);
}

// prevent HTML injection
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- boot ----------
(async function boot() {
  setScope("egypt");

  // load data
  try {
    translations = await loadJSON("assets/data/lang.json");
    knowledgeBase = await loadJSON("assets/data/knowledge.json");
    applyLanguage();
  } catch (e) {
    // fallback minimal
    console.warn(e);
  }
})();