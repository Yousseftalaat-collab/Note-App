import { loadAll } from "./notes.js";
import * as ui from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  // ===== MOBILE ELEMENTS =====
  const mobileBurger = document.getElementById("mobileBurger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileCloseMenu = document.getElementById("mobileCloseMenu");
  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  const mobileSearchWrap = document.getElementById("mobileSearchWrap");
  const mobileSearchClose = document.getElementById("mobileSearchClose");
  const mobileThemeToggle = document.getElementById("mobileThemeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const mobileBtnNotes = document.getElementById("mobileBtnNotes");
  const mobileBtnAdd = document.getElementById("mobileBtnAdd");

  // ===== DESKTOP/SHARED ELEMENTS =====
  const btnNotes = document.getElementById("btnNotes");
  const btnAdd = document.getElementById("btnAdd");
  const notesSidebar = document.getElementById("notesSidebar");
  const closeBtn = document.getElementById("closeNotesSidebar");
  const addNoteView = document.getElementById("addNoteView");
  const detailView = document.getElementById("noteDetail");
  const app = document.querySelector(".app");

  // ===== OVERLAY =====
  let overlay = document.querySelector(".mobile-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "mobile-overlay";
    document.body.appendChild(overlay);
  }

  // ===== HELPERS =====
  const setActiveButton = (activeBtn) => {
    [btnNotes, btnAdd].forEach((b) => b?.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");
  };

  const showNotesSidebar = () => {
    setActiveButton(btnNotes);
    notesSidebar?.classList.remove("hidden");
    closeBtn?.classList.remove("hidden");
    app.classList.add("notes-open");
    app.classList.remove("menu-closed");

    if (!app.classList.contains("menu-open")) {
      overlay.classList.remove("active");
    }

    detailView?.classList.remove("hidden");
    addNoteView?.classList.add("hidden");

    const notes = loadAll();
    ui.init(notes);
  };

  const hideNotesSidebar = () => {
    notesSidebar?.classList.add("hidden");
    closeBtn?.classList.add("hidden");
    app.classList.remove("notes-open");
    btnNotes?.classList.remove("active");
    app.classList.remove("menu-closed");

    if (!app.classList.contains("menu-open")) {
      overlay.classList.remove("active");
    }
  };

  // Controlled open/close for mobile menu with flags
  const openMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("hidden");
    overlay.classList.add("active");
    mobileBurger?.classList.add("open");
    app.classList.add("menu-open");
    app.classList.remove("menu-closed");
    mobileMenu?.setAttribute("aria-hidden", "false");
    mobileBurger?.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add("hidden");
    overlay.classList.remove("active");
    mobileBurger?.classList.remove("open");
    app.classList.remove("menu-open");
    if (app.classList.contains("notes-open")) {
      app.classList.add("menu-closed");
    } else {
      app.classList.remove("menu-closed");
    }
    mobileMenu?.setAttribute("aria-hidden", "true");
    mobileBurger?.setAttribute("aria-expanded", "false");
  };

  // ===== MENU TOGGLE =====
  mobileBurger?.addEventListener("click", (e) => {
    e.stopPropagation();
    const visible = !mobileMenu?.classList.contains("hidden");
    visible ? closeMenu() : openMenu();
  });

  // clicking overlay closes menu & notes
  overlay.addEventListener("click", () => {
    closeMenu();
    hideNotesSidebar();
  });

  mobileCloseMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
  });

  mobileBtnNotes?.addEventListener("click", (e) => {
    e.stopPropagation();
    showNotesSidebar();
  });

  mobileBtnAdd?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
    hideNotesSidebar();
    setActiveButton(btnAdd);
    addNoteView?.classList.remove("hidden");
    detailView?.classList.add("hidden");
  });

  // ===== SEARCH =====
  mobileSearchBtn?.addEventListener("click", () => {
    mobileSearchWrap?.classList.toggle("hidden");
    const inp = document.getElementById("searchInputMobile");
    if (inp) inp.focus();
  });
  mobileSearchClose?.addEventListener("click", () => {
    mobileSearchWrap?.classList.add("hidden");
  });

  // ===== THEME TOGGLE =====
  function setTheme(isDark) {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("almdrasa-theme", isDark ? "dark" : "light");
  }
  const savedTheme = localStorage.getItem("almdrasa-theme");
  if (savedTheme === "dark") setTheme(true);
  mobileThemeToggle?.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(!isDark);
  });

  document.body.addEventListener("click", (e) => {
    const noteItem = e.target.closest(".note-item, .note-card");
    if (!noteItem) return;

    const noteId =
      noteItem.dataset.id ||
      noteItem.dataset.noteId ||
      noteItem.dataset.note ||
      null;
    if (!noteId) return;

    console.log("note click id:", noteId);

    const notes = loadAll();
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
      console.warn("Note not found for id", noteId);
      return;
    }

    if (typeof ui.openNote === "function") {
      ui.openNote(note);
    } else {
      console.warn(
        "ui.openNote not available — falling back to inline render",
        ui
      );
      const titleEl = document.getElementById("noteTitle");
      const dateEl = document.getElementById("noteDate");
      const authorEl = document.getElementById("noteAuthor");
      const bodyEl = document.getElementById("noteBody");

      document.getElementById("detailPlaceholder")?.classList.add("hidden");
      document.getElementById("noteContent")?.classList.remove("hidden");

      titleEl && (titleEl.textContent = note.title ?? "");
      dateEl && (dateEl.textContent = note.date ?? "");
      authorEl && (authorEl.textContent = note.author ?? "");
      bodyEl && (bodyEl.innerHTML = note.body ?? "");
    }

    hideNotesSidebar();

    app.classList.remove("menu-closed");
  });

  // ===== DESKTOP BUTTONS =====
  btnNotes?.addEventListener("click", () => {
    showNotesSidebar();
  });
  btnAdd?.addEventListener("click", () => {
    hideNotesSidebar();
    setActiveButton(btnAdd);
    addNoteView?.classList.remove("hidden");
    detailView?.classList.add("hidden");
  });

  closeBtn?.addEventListener("click", hideNotesSidebar);

  // initial render
  const notes = loadAll();
  ui.init(notes);
});
