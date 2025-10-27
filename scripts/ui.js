// ui.js
import { deleteNote as deleteNoteModel } from "./notes.js";

const dom = {
  searchInput: () => document.getElementById("searchInput"),
  pinnedContainer: () => document.getElementById("pinnedNotesContainer"),
  normalContainer: () => document.getElementById("normalNotesContainer"),
  noteContent: () => document.getElementById("noteContent"),
  noteTitle: () => document.getElementById("noteTitle"),
  noteAuthor: () => document.getElementById("noteAuthor"),
  noteDate: () => document.getElementById("noteDate"),
  noteBody: () => document.getElementById("noteBody"),
  detailPlaceholder: () => document.getElementById("detailPlaceholder"),
  notesSidebar: () => document.getElementById("notesSidebar"),
  btnDelete: () => document.getElementById("btnDelete"),
};

let notes = [];
let selectedNoteId = null;

export function init(initialNotes = []) {
  notes = initialNotes.slice();
  renderNotesSidebar();
  attachSearch();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
export function renderNotesSidebar(filter = "") {
  const pinnedC = dom.pinnedContainer();
  const normalC = dom.normalContainer();
  pinnedC.innerHTML = "";
  normalC.innerHTML = "";

  const filtered = notes.filter((n) =>
    `${n.title} ${n.author} ${n.body}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.pinned);
  const normal = filtered.filter((n) => !n.pinned);

  [...pinned, ...normal].forEach((note) => {
    const el = document.createElement("div");
    el.classList.add("note-card", note.pinned ? "pinned-card" : "normal-card");
    el.dataset.noteId = note.id;

    const tmp = document.createElement("div");
    tmp.innerHTML = note.body || "";
    const preview = (tmp.textContent || "").slice(0, 200);

    const displayDate = note.displayDate
      ? note.displayDate
      : formatDate(note.createdAt);

    el.innerHTML = `
      <h4>${escapeHtml(note.title || "(no title)")}</h4>
      <p>${escapeHtml(preview)}</p>
      <div class="note-footer">
        <span>${formatDate(note.createdAt)}</span>
        <button class="delete-btn" data-id="${note.id}">Delete</button>
      </div>
    `;

    el.addEventListener("click", () => openNote(note.id));
    const delBtn = el.querySelector(".delete-btn");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });
    }

    (note.pinned ? pinnedC : normalC).appendChild(el);
  });
}

export function openNote(id) {
  const n = notes.find((x) => x.id === id);
  if (!n) return;

  selectedNoteId = id;
  dom.detailPlaceholder().classList.add("hidden");
  const nc = dom.noteContent();
  nc.classList.remove("hidden");
  nc.dataset.noteId = n.id;

  dom.noteTitle().textContent = n.title || "";
  dom.noteAuthor().textContent = n.author || "";

  dom.noteDate().textContent = n.displayDate
    ? n.displayDate
    : formatDate(n.createdAt);

  dom.noteBody().innerHTML = n.body || "";
}

function deleteNote(id) {
  if (!confirm("Delete this note?")) return;
  notes = deleteNoteModel(notes, id);
  renderNotesSidebar(dom.searchInput().value);
  dom.noteContent().classList.add("hidden");
  dom.detailPlaceholder().classList.remove("hidden");
  if (selectedNoteId === id) selectedNoteId = null;
}

function attachSearch() {
  const si = dom.searchInput();
  if (si) {
    si.addEventListener("input", (e) => renderNotesSidebar(e.target.value));
    si.addEventListener("input", onSearchInput);
  }
}

function onSearchInput(e) {
  renderNotesSidebar(e.target.value);
}

function escapeHtml(str) {
  return str
    ? str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    : "";
}
