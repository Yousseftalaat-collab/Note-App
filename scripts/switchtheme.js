// switchtheme.js

const THEME_KEY = "almdrasa-theme";
const html = document.documentElement;

function emitThemeChanged(theme) {
  try {
    const ev = new CustomEvent("theme-changed", {
      detail: { theme, source: "switchtheme" },
    });
    window.dispatchEvent(ev);
  } catch (e) {}
}

function createToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "themeToggle";
  btn.className = "theme-toggle";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Toggle dark / light theme");
  btn.innerHTML = `
    <span class="sun" aria-hidden="true">☀️</span>
    <span class="moon" aria-hidden="true">🌙</span>
  `;

  btn.addEventListener("click", () => {
    const active =
      html.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = active === "dark" ? "light" : "dark";
    applyTheme(next, true, "user");
  });

  return btn;
}

function applyTheme(theme, persist = false, source = "switchtheme") {
  try {
    if (theme === "dark") {
      html.setAttribute("data-theme", "dark");
      document
        .getElementById("themeToggle")
        ?.setAttribute("aria-pressed", "true");
    } else {
      html.setAttribute("data-theme", "light");
      document
        .getElementById("themeToggle")
        ?.setAttribute("aria-pressed", "false");
    }
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {}
    }
    emitThemeChanged(theme);
  } catch (err) {
    console.error("applyTheme error", err);
  }
}

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (e) {
    // ignore
  }
  try {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
  } catch (e) {}
  return "light";
}

function initThemeToggle() {
  if (document.getElementById("themeToggle")) return;
  const toggle = createToggle();
  document.body.appendChild(toggle);

  const preferred = getPreferredTheme();
  applyTheme(preferred, false, "init");

  requestAnimationFrame(() => toggle.classList.add("initialized"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeToggle);
} else {
  initThemeToggle();
}

try {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", (e) => {
    try {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? "dark" : "light", false, "system");
      }
    } catch (e) {}
  });
} catch (e) {}

window.AlmdrasaTheme = {
  apply: applyTheme,
  current: () =>
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  key: THEME_KEY,
};
