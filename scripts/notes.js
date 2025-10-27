// notes.js
import { saveNotes, loadNotes } from "./storage.js";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createNote({
  title = "",
  author = "",
  body = "",
  pinned = false,
} = {}) {
  return {
    id: uid(),
    title,
    author,
    body,
    pinned: !!pinned,
    createdAt: new Date().toISOString(),
  };
}

export function loadAll() {
  return loadNotes();
}

export function persist(notes) {
  saveNotes(notes);
}

export function addNote(notes, noteObj) {
  // ensure positions exist
  const maxPos =
    notes.length > 0
      ? Math.max(
          ...notes.map((n) =>
            typeof n.position === "number" ? n.position : -1
          )
        )
      : -1;
  noteObj.position = maxPos + 1;

  const newNotes = [...notes, noteObj];
  persist(newNotes);
  return newNotes;
}

export function deleteNote(notes, id) {
  const newNotes = notes.filter((n) => n.id !== id);
  persist(newNotes);
  return newNotes;
}

export function togglePin(notes, id) {
  const newNotes = notes.map((n) =>
    n.id === id ? { ...n, pinned: !n.pinned } : n
  );
  newNotes.sort(
    (a, b) => b.pinned - a.pinned || (a.position ?? 0) - (b.position ?? 0)
  );
  persist(newNotes);
  return newNotes;
}
