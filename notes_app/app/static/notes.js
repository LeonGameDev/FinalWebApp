console.log("Note loaded");

document.addEventListener("DOMContentLoaded", () => {
  // Add these variables at the top of your notes.js
let saveTimer = null;
let currentNoteId = null;
let hasUnsavedChanges = false;

// Add these event listeners in your DOMContentLoaded callback
document.getElementById('newNoteBtn').addEventListener('click', () => {
  openNoteModal();
});

// Add these functions to your notes.js
function openNoteModal(noteId = null) {
  const modal = new bootstrap.Modal(document.getElementById('noteModal'));
  const titleField = document.getElementById('noteTitle');
  const contentField = document.getElementById('noteContent');
  const modalTitle = document.getElementById('modalTitle');
  const noteIdField = document.getElementById('noteId');
  const saveStatus = document.getElementById('saveStatus');
  
  // Reset fields
  titleField.value = '';
  contentField.value = '';
  noteIdField.value = '';
  saveStatus.textContent = '';
  currentNoteId = null;
  
  if (noteId) {
    // Editing existing note
    modalTitle.textContent = 'Edit Note';
    noteIdField.value = noteId;
    currentNoteId = noteId;
    
    // Fetch note content
    fetch(`/note/get/${noteId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          titleField.value = data.note.title;
          contentField.value = data.note.content;
        }
      });
  } else {
    // Creating new note
    modalTitle.textContent = 'New Note';
  }
  
  // Clear any existing timers
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  
  // Set up auto-save listeners
  titleField.addEventListener('input', scheduleSave);
  contentField.addEventListener('input', scheduleSave);
  
  modal.show();
}

function scheduleSave() {
  hasUnsavedChanges = true;
  
  // Clear any pending save
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  
  // Set new save timer (1 second after last change)
  saveTimer = setTimeout(saveNote, 1000);
  
  // Update status
  document.getElementById('saveStatus').textContent = 'Unsaved changes...';
}

function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const noteId = document.getElementById('noteId').value;
  const saveStatus = document.getElementById('saveStatus');
  
  if (!title || !content) {
    saveStatus.textContent = 'Title and content are required';
    return;
  }
  
  const data = {
    id: noteId || null,
    title: title,
    content: content
  };
  
  fetch('/note/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      saveStatus.textContent = 'Saved';
      hasUnsavedChanges = false;
      
      if (!noteId) {
        // If this was a new note, update the ID
        currentNoteId = data.id;
        document.getElementById('noteId').value = data.id;
        
        // Add the new note to the UI
        addNoteToUI(data.id, title, content);
      } else {
        // Update existing note in UI
        updateNoteInUI(data.id, title, content);
      }
    } else {
      saveStatus.textContent = 'Error saving note';
    }
  })
  .catch(() => {
    saveStatus.textContent = 'Error saving note';
  });
}

function addNoteToUI(id, title, content) {
  // Create a new note card and add it to the DOM
  const notesContainer = document.getElementById('notesContainer');
  const newNoteHtml = `
    <div class="col-12 col-md-2 grid-view-item mb-3" data-title="${title.toLowerCase()}" data-time="${Math.floor(Date.now()/1000)}">
      <div class="card position-relative p-3 shadow-sm h-100 d-flex flex-column justify-content-between" 
           data-note-id="${id}">
        <h5 class="card-title">${title}</h5>
        <div class="d-flex flex-wrap gap-2 mt-2">
          <button class="btn btn-sm btn-outline-success color-palette me-2" title="Change Color">🎨</button>
          <input type="color" class="form-control form-control-color color-picker d-none" value="#ffffff">
          <button class="btn btn-sm btn-outline-danger lock-btn me-2" title="Lock/Unlock Note">
            <i class="bi bi-shield-lock" style="font-size: 1rem;"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary share-btn me-2" title="Share Note">
            <i class="bi bi-share" style="font-size: 1rem;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  notesContainer.insertAdjacentHTML('afterbegin', newNoteHtml);
}

function updateNoteInUI(id, title, content) {
  // Update an existing note in the UI
  const noteElement = document.querySelector(`[data-note-id="${id}"]`);
  if (noteElement) {
    const titleElement = noteElement.querySelector('.card-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
    noteElement.closest('[data-title]').dataset.title = title.toLowerCase();
  }
}

// Add this to handle clicking on notes to edit them
// document.addEventListener('click', (e) => {
//   const card = e.target.closest('.card');
//   if (card && !e.target.closest('.locked-overlay') && !e.target.closest('.btn')) {
//     const noteId = card.dataset.noteId;
//     openNoteModal(noteId);
//   }
// });
  // Replace the existing card event listeners with this:
  document.querySelectorAll(".card").forEach(card => {
  let longPressActive = false;
  let pressTimer;
  const longPressDuration = 500; // milliseconds

  // Handle mouse down (start of press)
  card.addEventListener("mousedown", (e) => {
    // Ignore if clicking on buttons or locked overlay
    if (e.target.closest('.btn') || e.target.closest('.locked-overlay')) {
      return;
    }

    // Start timer for long press
    pressTimer = setTimeout(() => {
      longPressActive = true;
      activeNote = card;
      updateToolbarContent(card);
      showToolbar(card);
    }, longPressDuration);
  });

  // Handle mouse up (end of press)
  card.addEventListener("mouseup", (e) => {
    clearTimeout(pressTimer);
    
    // If this wasn't a long press, handle as click
    if (!longPressActive && !e.target.closest('.btn') && !e.target.closest('.locked-overlay')) {
      const noteId = card.dataset.noteId;
      openNoteModal(noteId);
    }
    
    longPressActive = false;
  });

  // Handle mouse leave (cancel long press if mouse leaves)
  card.addEventListener("mouseleave", () => {
    clearTimeout(pressTimer);
    longPressActive = false;
  });

  // Prevent text selection during long press
  card.addEventListener("selectstart", (e) => {
    if (pressTimer) {
      e.preventDefault();
    }
  });
  });


// Add this to handle modal closing
document.getElementById('noteModal').addEventListener('hidden.bs.modal', () => {
  if (hasUnsavedChanges) {
    const confirmClose = confirm('You have unsaved changes. Close anyway?');
    if (!confirmClose) {
      // Reopen modal if user wants to keep editing
      setTimeout(() => {
        const modal = new bootstrap.Modal(document.getElementById('noteModal'));
        modal.show();
      }, 10);
      return;
    }
  }
  
  // Clean up
  const titleField = document.getElementById('noteTitle');
  const contentField = document.getElementById('noteContent');
  
  titleField.removeEventListener('input', scheduleSave);
  contentField.removeEventListener('input', scheduleSave);
  
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  
  hasUnsavedChanges = false;
  currentNoteId = null;
  });
  const toolbar = document.getElementById("noteActionToolbar");
  const notesContainer = document.getElementById("notesContainer");
  const searchInput = document.getElementById("liveSearchInput");
  const searchBar = document.getElementById("liveSearchBar");
  const noResults = document.getElementById("noResults");

  let longPressTimer = null;
  let activeNote = null;

  const unlockedNotes = JSON.parse(localStorage.getItem('unlockedNotes') || "[]");

  document.querySelectorAll('[data-note-id]').forEach(card => {
    const noteId = card.dataset.noteId;
    const isLocked = card.dataset.isLocked === "1";
    const overlay = card.querySelector(".locked-overlay");

    if (isLocked && !unlockedNotes.includes(noteId)) {
      // Should stay locked
      overlay.classList.remove('d-none');
    } else {
      // Unlocked (either no password or user unlocked)
      overlay.classList.add('d-none');
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

  let unlockNoteId = null;

  document.querySelectorAll('.locked-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = overlay.closest('.card');
      unlockNoteId = card.dataset.noteId;

      // Open modal
      const modal = new bootstrap.Modal(document.getElementById('unlockModal'));
      modal.show();
    });
  });

  document.getElementById('unlockSubmitBtn').addEventListener('click', async () => {
    const password = document.getElementById('unlockPassword').value.trim();
    if (!password) return;

    const res = await fetch(`/note/unlock/${unlockNoteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    if (data.success) {
      const card = document.querySelector(`[data-note-id="${unlockNoteId}"]`);
      const overlay = card.querySelector('.locked-overlay');
      overlay.classList.add('d-none');

      // Update localStorage
      let unlocked = JSON.parse(localStorage.getItem("unlockedNotes") || "[]");
      if (!unlocked.includes(unlockNoteId)) {
        unlocked.push(unlockNoteId);
        localStorage.setItem("unlockedNotes", JSON.stringify(unlocked));
      }

      // Close modal
      const modalEl = document.getElementById('unlockModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      document.getElementById('unlockPassword').value = "";
    } else {
      alert(data.message || "Incorrect password.");
    }
  });

  let lockNoteId = null;

  // Open Lock Modal
  document.querySelectorAll('.lock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.card');
      const overlay = card.querySelector('.locked-overlay');
      const noteId = card.dataset.noteId;

      const isLocked = !overlay.classList.contains('d-none');
      if (isLocked) return; // Don't allow re-lock if already locked

      lockNoteId = noteId;
      const modal = new bootstrap.Modal(document.getElementById('lockModal'));
      modal.show();
    });
  });

  // Submit Lock
  document.getElementById('lockSubmitBtn').addEventListener('click', async () => {
    const password = document.getElementById('lockPassword').value.trim();
    const confirm = document.getElementById('lockConfirm').value.trim();
    const errorDiv = document.getElementById('lockError');

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      errorDiv.textContent = "Password must be 8+ chars, include uppercase, lowercase, number, special character.";
      errorDiv.classList.remove('d-none');
      return;
    }

    if (password !== confirm) {
      errorDiv.textContent = "Passwords do not match.";
      errorDiv.classList.remove('d-none');
      return;
    }

    errorDiv.classList.add('d-none');

    const res = await fetch(`/note/lock/${lockNoteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    if (data.success) {
      const card = document.querySelector(`[data-note-id="${lockNoteId}"]`);
      const overlay = card.querySelector('.locked-overlay');
      overlay.classList.remove('d-none');

      let unlocked = JSON.parse(localStorage.getItem("unlockedNotes") || []);
      const index = unlocked.indexOf(lockNoteId);
      if (index !== -1) {
        unlocked.splice(index, 1);
        localStorage.setItem("unlockedNotes", JSON.stringify(unlocked));
      }

      // Close modal
      const modalEl = document.getElementById('lockModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      document.getElementById('lockPassword').value = "";
      document.getElementById('lockConfirm').value = "";
    } else {
      alert(data.message || "Failed to lock note.");
    }
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
