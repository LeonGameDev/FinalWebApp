console.log("Note loaded");

document.addEventListener("DOMContentLoaded", () => {
  const toolbar = document.getElementById("noteActionToolbar");
  const notesContainer = document.getElementById("notesContainer");
  const searchInput = document.getElementById("liveSearchInput");
  const searchBar = document.getElementById("liveSearchBar");
  const noResults = document.getElementById("noResults");

  let longPressTimer = null;
  let activeNote = null;

  const unlockedNotes = JSON.parse(localStorage.getItem('unlockedNotes') || "[]");
  unlockedNotes.forEach(id => {
    const card = document.querySelector(`[data-note-id="${id}"]`);
    if (card) {
      const overlay = card.querySelector(".locked-overlay");
      if (overlay) overlay.classList.add("d-none");
    }
  });

  // Handle long press on notes to activate toolbar
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

  // Show the toolbar near the active note
  function showToolbar(card) {
    const rect = card.getBoundingClientRect();
    toolbar.style.left = `${rect.left + window.scrollX}px`;
    toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
    toolbar.classList.remove("d-none");
    toolbar.classList.add("d-flex");
  }

  // Update the toolbar content based on the note's pinned status
  function updateToolbarContent(card) {
    const isPinned = card.classList.contains("pinned");
    document.getElementById("pinText").textContent = isPinned ? "Unpin" : "Pin";
    document.getElementById("pinIcon").textContent = isPinned ? "📌" : "📍";
  }

  // Edit button click handler
  document.getElementById("editBtn").addEventListener("click", () => {
    if (activeNote) {
      const id = activeNote.dataset.noteId;
      window.location.href = `/note/edit/${id}`;
    }
  });

  // Delete button click handler
  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (activeNote && confirm("Delete this note?")) {
      const id = activeNote.dataset.noteId;
      window.location.href = `/note/delete/${id}`;
    }
  });

  // Pin button click handler
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
        reorderNotes();  // Reorder notes after pinning
        updateToolbarContent(activeNote);  // Update toolbar content after pinning
      });
  });

  // Reorder notes based on pin status and title sorting
  function reorderNotes(order = "asc") {
    const items = Array.from(notesContainer.children);
    const pinned = items.filter(item => item.querySelector(".card").classList.contains("pinned"));
    const unpinned = items.filter(item => !item.querySelector(".card").classList.contains("pinned"));

    const sortByTitle = (a, b) => {
      const titleA = a.dataset.title.trim().toLowerCase();
      const titleB = b.dataset.title.trim().toLowerCase();
      return order === "asc" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    };

    const sortByTime = (a, b) => {
      const timeA = parseInt(a.dataset.time);
      const timeB = parseInt(b.dataset.time);
      return order === "newest" ? timeB - timeA : timeA - timeB;
    };

    const sortFn = order === "asc" || order === "desc" ? sortByTitle : sortByTime;

    pinned.sort(sortFn);
    unpinned.sort(sortFn);

    notesContainer.innerHTML = "";
    [...pinned, ...unpinned].forEach(item => notesContainer.appendChild(item));

    if (activeNote && !toolbar.classList.contains("d-none")) {
      const rect = activeNote.getBoundingClientRect();
      toolbar.style.left = `${rect.left + window.scrollX}px`;
      toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
    }
  }

  // Dismiss toolbar if clicked outside
  document.addEventListener("click", (e) => {
    if (!toolbar.contains(e.target) && (!activeNote || !activeNote.contains(e.target))) {
      toolbar.classList.add("d-none");
      toolbar.classList.remove("d-flex");
      activeNote = null;
    }
  });

  // Live search functionality
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

  // Filter notes based on search input
  function filterNotes(text) {
    let found = false;
    document.querySelectorAll("[data-title]").forEach(card => {
      const match = card.dataset.title.includes(text);
      card.style.display = match ? "" : "none";
      if (match) found = true;
    });
    noResults.style.display = found ? "none" : "block";
  }

  document.querySelectorAll('.lock-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.card');
      const overlay = card.querySelector('.locked-overlay');
      const noteId = card.dataset.noteId;
  
      const password = prompt("Set a password for this note:");
      if (!password) return;
  
      const res = await fetch(`/note/lock/${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
  
      const data = await res.json();
      if (data.success) {
        overlay.classList.remove('d-none');
  
        // 🔒 Remove note from localStorage if it was unlocked before
        let unlocked = JSON.parse(localStorage.getItem("unlockedNotes") || "[]");
        const index = unlocked.indexOf(noteId);
        if (index !== -1) {
          unlocked.splice(index, 1);
          localStorage.setItem("unlockedNotes", JSON.stringify(unlocked));
        }
      } else {
        alert(data.message || "Failed to lock note.");
      }
    });
  });  

  document.querySelectorAll('.locked-overlay').forEach(overlay => {
    overlay.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = overlay.closest('.card');
      const noteId = card.dataset.noteId;
  
      const password = prompt("Enter your password to unlock:");
      if (!password) return;
  
      const res = await fetch(`/note/unlock/${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
  
      const data = await res.json();
      if (data.success) {
        overlay.classList.add('d-none');
  
        // Optional: remember unlocked note in localStorage
        let unlocked = JSON.parse(localStorage.getItem("unlockedNotes") || "[]");
        if (!unlocked.includes(noteId)) {
          unlocked.push(noteId);
          localStorage.setItem("unlockedNotes", JSON.stringify(unlocked));
        }
      } else {
        alert(data.message || "Incorrect password.");
      }
    });
  });

  // Add sort event listeners for the sort options
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', function(e) {
      e.preventDefault();
      const direction = this.dataset.sort;
      reorderNotes(direction);  // Reorder notes based on sort direction
    });
  });

  reorderNotes("asc");
});
