console.log("Note loaded");
document.addEventListener("DOMContentLoaded", () => {
  const toolbar = document.getElementById("noteActionToolbar");
  const notesContainer = document.getElementById("notesContainer");
  const searchInput = document.getElementById("liveSearchInput");
  const searchBar = document.getElementById("liveSearchBar");
  const noResults = document.getElementById("noResults");

  let longPressTimer = null;
  let activeNote = null;

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mousedown", () => {
    longPressTimer = setTimeout(() => {
      activeNote = card;
      updateToolbarContent(card);
      showToolbar(card);
    }, 500);
  });

  card.addEventListener("mouseup", () => clearTimeout(longPressTimer));
  card.addEventListener("mouseleave", () => clearTimeout(longPressTimer));
});

function showToolbar(card) {
  const rect = card.getBoundingClientRect();
  toolbar.style.left = `${rect.left + window.scrollX}px`;
  toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
  toolbar.classList.remove("d-none");
  toolbar.classList.add("d-flex");
}

function updateToolbarContent(card) {
  const isPinned = card.classList.contains("pinned");
  document.getElementById("pinText").textContent = isPinned ? "Unpin" : "Pin";
  document.getElementById("pinIcon").textContent = isPinned ? "📌" : "📍";
}

document.getElementById("editBtn").addEventListener("click", () => {
  if (activeNote) {
    const id = activeNote.dataset.noteId;
    window.location.href = `/note/edit/${id}`;
  }
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (activeNote && confirm("Delete this note?")) {
    const id = activeNote.dataset.noteId;
    window.location.href = `/note/delete/${id}`;
  }
});

document.getElementById("pinBtn").addEventListener("click", () => {
  if (!activeNote) return;
  const id = activeNote.dataset.noteId;

  fetch(`/note/pin/${id}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const pinnedClass = "pinned";
      const iconHTML = '<div class="position-absolute top-0 end-0 p-2 text-warning pin-icon">📌</div>';

      if (data.pinned) {
        activeNote.classList.add(pinnedClass);
        if (!activeNote.querySelector(".pin-icon")) {
          activeNote.insertAdjacentHTML("afterbegin", iconHTML);
        }
      } else {
        activeNote.classList.remove(pinnedClass);
        const icon = activeNote.querySelector(".pin-icon");
        if (icon) icon.remove();
        location.reload();
      }
      reorderNotes();
      updateToolbarContent(activeNote);
    });
});

function reorderNotes() {
  const items = Array.from(notesContainer.children);
  const pinned = items.filter(item => item.querySelector(".card").classList.contains("pinned"));
  const unpinned = items.filter(item => !item.querySelector(".card").classList.contains("pinned"));

  notesContainer.innerHTML = "";
  [...pinned, ...unpinned].forEach(item => notesContainer.appendChild(item));

  if (activeNote && !toolbar.classList.contains("d-none")) {
    const rect = activeNote.getBoundingClientRect();
    toolbar.style.left = `${rect.left + window.scrollX}px`;
    toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
  }
}
  
// Dismiss toolbar
document.addEventListener("click", (e) => {
  if (!toolbar.contains(e.target) && (!activeNote || !activeNote.contains(e.target))) {
    toolbar.classList.add("d-none");
    toolbar.classList.remove("d-flex");
    activeNote = null;
  }
});
  
// Live search shortcut
document.addEventListener("keydown", (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (tag !== "input" && tag !== "textarea" && e.key.length === 1) {
    e.preventDefault();
    searchBar.classList.add("active");
    searchInput.focus();
    searchInput.value += e.key;
    searchInput.dispatchEvent(new Event("input"));
  }

  if (e.key === "Escape") {
    searchBar.classList.remove("active");
    searchInput.value = "";
    filterNotes("");
  }
});

searchInput.addEventListener("input", () => {
  filterNotes(searchInput.value.toLowerCase());
});

function filterNotes(text) {
  let found = false;
  document.querySelectorAll("[data-title]").forEach(card => {
    const match = card.dataset.title.includes(text);
    card.style.display = match ? "" : "none";
    if (match) found = true;
  });
  noResults.style.display = found ? "none" : "block";
}
});

document.querySelectorAll('.lock-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.card');
    const overlay = card.querySelector('.locked-overlay');
    overlay.classList.remove('d-none');
  });
});

document.querySelectorAll('.locked-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent triggering other events
    overlay.classList.add('d-none');
  });
});

document.querySelectorAll(".sort-option").forEach(option => {
  option.addEventListener("click", function(e) {
    e.preventDefault();
    const direction = this.dataset.sort;
    sortNotes(direction);
  });
});

function sortNotes(order = "asc") {
  const container = document.getElementById("notesContainer");
  const items = Array.from(container.children);

  const sorted = items.sort((a, b) => {
    const titleA = a.dataset.title.trim();
    const titleB = b.dataset.title.trim();
    return order === "asc" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
  });

  container.innerHTML = "";
  sorted.forEach(note => container.appendChild(note));
}


  