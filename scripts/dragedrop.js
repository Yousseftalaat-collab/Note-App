// dragedrop.js
// Lightweight drag & drop for notes. Compatible with your initDragDrop API:
// initDragDrop({ containers: [pinnedEl, normalEl], getNotes, saveNotes, onReorder })

export default function initDragDrop({
  containers = [],
  getNotes,
  saveNotes,
  onReorder,
} = {}) {
  if (
    !Array.isArray(containers) ||
    typeof getNotes !== "function" ||
    typeof saveNotes !== "function"
  ) {
    throw new Error(
      "initDragDrop requires { containers: Element[], getNotes: fn, saveNotes: fn }"
    );
  }

  let draggedEl = null;

  function getCardId(card) {
    // support both data-note-id and data-id (fallback)
    return card?.dataset?.noteId || card?.dataset?.id || null;
  }

  function makeDraggable(card) {
    if (!card) return;
    // set draggable and keyboard focus
    card.setAttribute("draggable", "true");
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");

    // avoid adding duplicate listeners
    if (card.__dd_attached) return;
    card.__dd_attached = true;

    card.addEventListener("dragstart", (e) => {
      draggedEl = card;
      card.classList.add("dragging");
      const id = getCardId(card) || "";
      try {
        e.dataTransfer && e.dataTransfer.setData("text/plain", id);
        e.dataTransfer && (e.dataTransfer.effectAllowed = "move");
      } catch (err) {
        // ignore (some browsers block dataTransfer on touch)
      }
      // small delay to allow CSS change to apply
      setTimeout(() => card.classList.add("invisible-drag"), 20);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging", "invisible-drag");
      draggedEl = null;
    });

    // keyboard support: space or enter to pick up then arrow to move (basic)
    card.addEventListener("keydown", (ev) => {
      // Only allow when user presses Alt+Arrow for reordering to avoid interference
      if (!(ev.altKey && (ev.key === "ArrowUp" || ev.key === "ArrowDown")))
        return;
      ev.preventDefault();
      const container = card.parentElement;
      if (!container) return;
      const before =
        ev.key === "ArrowUp"
          ? card.previousElementSibling
          : card.nextElementSibling;
      if (before && before.classList.contains("note-card")) {
        if (ev.key === "ArrowUp") container.insertBefore(card, before);
        else container.insertBefore(before, card);
        updatePositionsFromDOM();
        typeof onReorder === "function" && onReorder();
      }
    });
  }

  function getDragAfterElement(container, clientY) {
    const draggableElements = [
      ...container.querySelectorAll(
        ".note-card:not(.dragging):not(.invisible-drag)"
      ),
    ];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    draggableElements.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset, element: child };
      }
    });
    return closest.element;
  }

  function attachContainer(container) {
    if (!container || container.__dd_attached) return;
    container.__dd_attached = true;

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const clientY =
        e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      const afterEl = getDragAfterElement(container, clientY);
      if (!draggedEl) return;
      if (!afterEl) {
        container.appendChild(draggedEl);
      } else {
        container.insertBefore(draggedEl, afterEl);
      }
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      // ensure draggedEl is placed
      if (draggedEl && draggedEl.parentElement !== container) {
        container.appendChild(draggedEl);
      }
      updatePositionsFromDOM();
      typeof onReorder === "function" && onReorder();
    });
  }

  function updatePositionsFromDOM() {
    const notes = Array.isArray(getNotes()) ? getNotes().slice() : [];
    const idToNote = new Map(notes.map((n) => [n.id, n]));
    let idx = 0;

    containers.forEach((container) => {
      // only count real .note-card nodes
      const cards = [...container.querySelectorAll(".note-card")];
      cards.forEach((card) => {
        const id = getCardId(card);
        if (!id) return;
        const note = idToNote.get(id);
        if (note) {
          note.position = idx++;
        }
      });
    });

    // any note not present gets appended positions
    notes.forEach((n) => {
      if (typeof n.position !== "number") {
        n.position = idx++;
      }
    });

    // persist changes
    try {
      saveNotes(notes);
    } catch (err) {
      console.error("Failed to save notes positions", err);
    }
  }

  function refresh() {
    // attach containers and make current cards draggable
    containers.forEach((c) => attachContainer(c));
    // make all visible note-cards draggable
    const allCards = document.querySelectorAll(".note-card");
    allCards.forEach((card) => makeDraggable(card));
  }

  // initial bind
  setTimeout(refresh, 30);

  return {
    refresh,
    updatePositionsFromDOM,
  };
}
