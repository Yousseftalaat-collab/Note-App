import {
  loadAll,
  persist,
  addNote,
  deleteNote,
  togglePin,
  createNote,
} from "./notes.js";
import * as ui from "./ui.js";
import initDragDrop from "./dragedrop.js";

import "./switchtheme.js";
import "./mobile.js";

const app = document.querySelector(".app");
const btnNotes = document.getElementById("btnNotes");
const btnAdd = document.getElementById("btnAdd");
const notesSidebar = document.getElementById("notesSidebar");
const closeBtn = document.getElementById("closeNotesSidebar");
const btnDelete = document.getElementById("btnDelete");
const floatingAdd = document.getElementById("floatingAdd");

const detailView = document.getElementById("noteDetail");
const noteContentEl = document.getElementById("noteContent");
const editBtn = document.getElementById("btnEdit");
const addNoteView = document.getElementById("addNoteView");

const pinnedContainer = document.getElementById("pinnedNotesContainer");
const normalContainer = document.getElementById("normalNotesContainer");

const searchInputDesktop = document.getElementById("searchInput");
const searchInputMobile = document.getElementById("searchInputMobile");

function sortForRender(notes) {
  return notes.slice().sort((a, b) => {
    if (b.pinned - a.pinned !== 0) return b.pinned - a.pinned;
    const aPos =
      typeof a.position === "number" ? a.position : Number.POSITIVE_INFINITY;
    const bPos =
      typeof b.position === "number" ? b.position : Number.POSITIVE_INFINITY;
    if (aPos !== bPos) return aPos - bPos;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

let dragDrop;

function renderAndAttach(notes) {
  const sorted = sortForRender(notes);
  ui.init(sorted);

  if (!dragDrop) {
    dragDrop = initDragDrop({
      containers: [pinnedContainer, normalContainer],
      getNotes: () => loadAll(),
      saveNotes: (n) => persist(n),
      onReorder: () => {
        const notesNow = loadAll();
        const sortedNow = sortForRender(notesNow);
        ui.init(sortedNow);
        dragDrop.refresh();
      },
    });
  }

  dragDrop.refresh();
}

// initial load
document.addEventListener("DOMContentLoaded", () => {
  let notes = loadAll() || [];

  if (!notes.some((n) => typeof n.position === "number")) {
    notes = notes.map((n, i) => ({ ...n, position: i }));
    persist(notes);
  }

  renderAndAttach(notes);
});

function setActiveButton(activeBtn) {
  [btnNotes, btnAdd].forEach((btn) => btn.classList.remove("active"));
  if (activeBtn) activeBtn.classList.add("active");
}

function showNotesSidebar() {
  setActiveButton(btnNotes);
  notesSidebar.classList.remove("hidden");
  closeBtn.classList.remove("hidden");
  app.classList.add("notes-open");
  detailView.classList.remove("hidden");
  addNoteView.classList.add("hidden");
}

function hideNotesSidebar() {
  notesSidebar.classList.add("hidden");
  closeBtn.classList.add("hidden");
  app.classList.remove("notes-open");
  btnNotes.classList.remove("active");
}

btnNotes.addEventListener("click", () => {
  const sidebarIsHidden = notesSidebar.classList.contains("hidden");
  sidebarIsHidden ? showNotesSidebar() : hideNotesSidebar();
});

btnAdd.addEventListener("click", () => {
  setActiveButton(btnAdd);
  hideNotesSidebar();
  addNoteView.classList.remove("hidden");
  detailView.classList.add("hidden");
});

// floating add also works
if (floatingAdd) {
  floatingAdd.addEventListener("click", () => {
    setActiveButton(btnAdd);
    hideNotesSidebar();
    addNoteView.classList.remove("hidden");
    detailView.classList.add("hidden");
  });
}

closeBtn.addEventListener("click", () => {
  hideNotesSidebar();
});

// ========= Inline Edit Logic (contentEditable) =========
let isEditing = false;

detailView.contentEditable = "false";

editBtn.addEventListener("click", () => {
  const noteId = noteContentEl.dataset.noteId;
  if (!noteId) return;

  const notes = loadAll();
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;

  const titleEl = document.getElementById("noteTitle");
  const authorEl = document.getElementById("noteAuthor");
  const dateEl = document.getElementById("noteDate");
  const bodyEl = document.getElementById("noteBody");

  if (!isEditing) {
    // Enter edit mode
    isEditing = true;
    editBtn.textContent = "Save Changes";

    titleEl.contentEditable = "true";
    authorEl.contentEditable = "true";
    dateEl.contentEditable = "true";
    bodyEl.contentEditable = "true";

    [titleEl, authorEl, dateEl, bodyEl].forEach((el) =>
      el.classList.add("editing")
    );

    const focusTarget = bodyEl.textContent.trim() ? bodyEl : titleEl;
    focusTarget.focus();
    const range = document.createRange();
    range.selectNodeContents(focusTarget);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // Save changes
    const newTitle = titleEl.textContent.trim();
    const newAuthor = authorEl.textContent.trim();
    const newDateText = dateEl.textContent.trim();
    const newBodyHTML = bodyEl.innerHTML.trim(); // preserve marks/colors

    const originalCreatedAt = note.createdAt;
    let parsed = newDateText ? new Date(newDateText) : null;

    if (parsed && !isNaN(parsed.getTime())) {
      note.createdAt = parsed.toISOString();
      delete note.displayDate;
    } else if (newDateText) {
      note.displayDate = newDateText;
      note.createdAt = originalCreatedAt;
    }

    note.title = newTitle;
    note.author = newAuthor;
    note.body = newBodyHTML;
    note.updatedAt = new Date().toISOString();

    persist(notes);

    const notesNow = loadAll();
    renderAndAttach(notesNow);
    ui.openNote(note.id);

    // Exit edit mode
    isEditing = false;
    editBtn.textContent = "Edit";
    [titleEl, authorEl, dateEl, bodyEl].forEach((el) => {
      el.contentEditable = "false";
      el.classList.remove("editing");
    });
  }
});

// ======= Highlight Tool =======
const btnHighlight = document.getElementById("btnHighlight");
const colorPicker = document.getElementById("colorPicker");

btnHighlight.addEventListener("click", () => {
  colorPicker.classList.toggle("hidden");
});

// Handle color click
colorPicker.querySelectorAll("span").forEach((colorEl) => {
  colorEl.addEventListener("click", () => {
    applyHighlight(colorEl.dataset.color);
    colorPicker.classList.add("hidden");
  });
});

document.getElementById("customColor").addEventListener("input", (e) => {
  applyHighlight(e.target.value);
  colorPicker.classList.add("hidden");
});

function placeCaretAfter(node) {
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// --- SAFER highlight function ---
function applyHighlight(color) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const noteBodyEl = document.getElementById("noteBody");
  if (!noteBodyEl || !noteBodyEl.contains(range.commonAncestorContainer))
    return;
  if (!selection.toString().trim()) return;

  const extracted = range.extractContents();

  const mark = document.createElement("mark");
  mark.appendChild(extracted);
  mark.style.backgroundColor = color;
  mark.style.padding = "2px 4px";
  mark.style.borderRadius = "3px";

  range.insertNode(mark);

  placeCaretAfter(mark);

  const noteId = noteContentEl.dataset.noteId;
  const notes = loadAll();
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    note.body = noteBodyEl.innerHTML;
    persist(notes);
  }
}

// ======= Text Color Tool =======
const btnTextColor = document.getElementById("btnTextColor");
const textColorPicker = document.getElementById("textColorPicker");

btnTextColor.addEventListener("click", () => {
  textColorPicker.classList.toggle("hidden");
});

textColorPicker.querySelectorAll("span").forEach((colorEl) => {
  colorEl.addEventListener("click", () => {
    applyTextColor(colorEl.dataset.color);
    textColorPicker.classList.add("hidden");
  });
});

document.getElementById("customTextColor").addEventListener("input", (e) => {
  applyTextColor(e.target.value);
  textColorPicker.classList.add("hidden");
});

// --- SAFER text color function ---
function applyTextColor(color) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const noteBodyEl = document.getElementById("noteBody");
  if (!noteBodyEl || !noteBodyEl.contains(range.commonAncestorContainer))
    return;

  const selectedText = range.toString();
  if (!selectedText.trim()) return;

  const extracted = range.extractContents();

  const span = document.createElement("span");
  span.appendChild(extracted);
  span.style.color = color;

  range.insertNode(span);

  placeCaretAfter(span);

  selection.removeAllRanges();

  // Save and persist
  const noteId = noteContentEl.dataset.noteId;
  const notes = loadAll();
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    note.body = noteBodyEl.innerHTML;
    persist(notes);
  }
}
btnDelete.addEventListener("click", () => {
  const noteId = noteContentEl.dataset.noteId;
  if (!noteId) return;

  const userConfirmed = window.confirm(
    "Are you sure you want to delete this note?"
  );
  if (!userConfirmed) return;

  const notes = loadAll().filter((n) => n.id !== noteId);
  persist(notes);
  ui.init(notes);
  noteContentEl.classList.add("hidden");
  document.getElementById("detailPlaceholder").classList.remove("hidden");
});

// --- Add Note form wiring ---
const addNoteForm = document.getElementById("addNoteForm");
const inputTitle = document.getElementById("inputTitle");
const inputAuthor = document.getElementById("inputAuthor");
const inputBody = document.getElementById("inputBody");
const btnAddPinned = document.getElementById("btnAddPinned");

function clearAddForm() {
  if (inputTitle) inputTitle.value = "";
  if (inputAuthor) inputAuthor.value = "";
  if (inputBody) inputBody.value = "";
}

// submit handler for "Add Note"
if (addNoteForm) {
  addNoteForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = inputTitle.value.trim();
    const author = inputAuthor.value.trim();
    const body = inputBody.value.trim();

    if (!title || !author || !body) {
      console.error("Please fill Title, Author and Your Note fields.");
      return;
    }

    const notesBefore = loadAll() || [];
    const newNoteObj = createNote({ title, author, body, pinned: false });
    const newNotes = addNote(notesBefore, newNoteObj);

    renderAndAttach(newNotes);
    ui.openNote(newNoteObj.id);

    setActiveButton(btnNotes);
    addNoteView.classList.add("hidden");
    detailView.classList.remove("hidden");

    clearAddForm();
  });
}

// handler for "Add pinned note" button
if (btnAddPinned) {
  btnAddPinned.addEventListener("click", (e) => {
    const title = inputTitle.value.trim();
    const author = inputAuthor.value.trim();
    const body = inputBody.value.trim();

    if (!title || !author || !body) {
      console.error(
        "Please fill Title, Author and Your Note fields before adding pinned note."
      );
      return;
    }

    const notesBefore = loadAll() || [];
    const newNoteObj = createNote({ title, author, body, pinned: true });
    const newNotes = addNote(notesBefore, newNoteObj);

    renderAndAttach(newNotes);
    ui.openNote(newNoteObj.id);

    setActiveButton(btnNotes);
    addNoteView.classList.add("hidden");
    detailView.classList.remove("hidden");

    clearAddForm();
  });
}
