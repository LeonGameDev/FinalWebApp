console.log("Note loaded");

document.addEventListener("DOMContentLoaded", () => {
  // Add these variables at the top of your notes.js
  let saveTimer = null;
  let currentNoteId = null;
  let hasUnsavedChanges = false;
  let currentFile = null;
  let fileConfirmed = false;
  let deleteType = null; // 'note' or 'file'
  let deleteNoteId = null;
  let deleteFilename = null;

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

  // Reset file input
  document.getElementById('noteFile').value = '';
  document.getElementById('fileError').classList.add('d-none');
  document.getElementById('filePreview').innerHTML = '';
  currentFile = null;
  
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
          
          // Show existing file if it exists
          if (data.note.file_url) {
            const file = data.note.file_url.split(',')[0]; // Get first file only
            const filePreview = document.getElementById('filePreview');
            filePreview.innerHTML = `
              <div class="alert alert-light p-2 mb-2 d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <i class="bi ${getFileIcon(file)} fs-3 me-3"></i>
                  <div>
                    <a href="/static/uploads/${file}" target="_blank">${file.split('_').pop()}</a>
                    <div class="text-muted small">${formatFileSize(file)}</div>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-saved-file" 
                        data-file="${file}" 
                        data-note-id="${noteId}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            `;
          }
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
  const fileInput = document.getElementById('noteFile');

  saveStatus.textContent = 'Saving...';
  saveStatus.style.color = '';
  
  // Don't require title/content if we're just adding a file
  if (!noteId && (!title || !content)) {
    saveStatus.textContent = 'Title and content are required for new notes';
    return;
  }
  
  const formData = new FormData();
  formData.append('id', noteId || '');
  if (title) formData.append('title', title);
  if (content) formData.append('content', content);
  
  if (fileInput.files.length > 0 && !fileConfirmed) {
    document.getElementById('fileError').textContent = 'Please confirm the file upload';
    document.getElementById('fileError').classList.remove('d-none');
    return;
  }

  if (fileInput.files.length > 0 && fileConfirmed) {
      for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          if (file.size > 1024 * 1024) {
              document.getElementById('fileError').textContent = 'One or more files exceed 1MB limit';
              document.getElementById('fileError').classList.remove('d-none');
              return;
          }
          formData.append('file', file);
      }
  }
  
  fetch('/note/save', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      saveStatus.textContent = 'Upload successful';
      saveStatus.className = 'upload-success small'; // Add this class
      saveStatus.style.color = ''; // Remove inline color
      hasUnsavedChanges = false;
      
      if (!noteId) {
        currentNoteId = data.id;
        document.getElementById('noteId').value = data.id;
        addNoteToUI(data.id, title, content);
      }
      
      // Update file preview for existing notes
      if (noteId) {
        updateFilePreview(noteId);
      }
      
      fileConfirmed = false;
    }
  })
  .catch(() => {
    saveStatus.textContent = 'Error saving note';
    saveStatus.style.color = 'red';
  });
}

function updateFilePreview(noteId) {
  fetch(`/note/get/${noteId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.note.file_url) {
        const filePreview = document.getElementById('filePreview');
        const file = data.note.file_url.split(',')[0]; // Only show first file
        filePreview.innerHTML = `
          <div class="alert alert-light p-2 mb-2 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <i class="bi ${getFileIcon(file)} fs-3 me-3"></i>
              <div>
                <a href="/static/uploads/${file}" target="_blank">${file.split('_').pop()}</a>
                <div class="text-muted small">${formatFileSize(file)}</div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-danger remove-saved-file" 
                    data-file="${file}" 
                    data-note-id="${noteId}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `;
      } else {
        document.getElementById('filePreview').innerHTML = '';
      }
    });
}

function getFileIcon(filename) {
  if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) return 'bi-file-image';
  if (filename.match(/\.pdf$/i)) return 'bi-file-earmark-pdf';
  if (filename.match(/\.(doc|docx)$/i)) return 'bi-file-earmark-word';
  if (filename.match(/\.(xls|xlsx)$/i)) return 'bi-file-earmark-excel';
  if (filename.match(/\.(zip|rar)$/i)) return 'bi-file-earmark-zip';
  return 'bi-file-earmark-text';
}

function updateNoteFileIndicator(noteId, fileUrls) {
  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  const fileIndicator = noteElement?.querySelector('.file-indicator');
  if (fileIndicator) {
    const fileCount = fileUrls ? (typeof fileUrls === 'string' ? fileUrls.split(',').length : 1) : 0;
    fileIndicator.classList.toggle('d-none', fileCount === 0);
    fileIndicator.innerHTML = fileCount > 0 ? 
      `<i class="bi bi-paperclip"></i> ${fileCount}` : '';
  }
}

// Add file preview functionality
document.getElementById('noteFile').addEventListener('change', function(e) {
  const fileError = document.getElementById('fileError');
  const filePreview = document.getElementById('filePreview');
  const confirmBtn = document.getElementById('confirmUploadBtn');
  const removeBtn = document.getElementById('removeFileBtn');
  
  fileError.classList.add('d-none');
  filePreview.innerHTML = '';
  confirmBtn.classList.add('d-none');
  removeBtn.classList.add('d-none');
  fileConfirmed = false;
  
  if (this.files.length > 0) {
    const file = this.files[0]; // Only process first file
    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar'];
    
    if (!allowedExts.includes(fileExt)) {
      fileError.textContent = 'File type not allowed. Only PNG, JPG, JPEG, GIF, PDF, DOC, DOCX, TXT, ZIP, RAR are supported.';
      fileError.classList.remove('d-none');
      this.value = '';
      return;
    }
    
    if (file.size > 1024 * 1024) {
      fileError.textContent = 'File exceeds 1MB size limit';
      fileError.classList.remove('d-none');
      this.value = '';
      return;
    }
    
    // Show preview
    const previewItem = document.createElement('div');
    previewItem.className = 'alert alert-light p-2 mb-2 d-flex justify-content-between align-items-center';
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewItem.innerHTML = `
          <div class="d-flex align-items-center">
            <img src="${e.target.result}" class="img-thumbnail me-3" style="max-height: 60px;">
            <div>
              <strong>${file.name}</strong><br>
              <span class="text-muted small">${formatFileSize(file.size)}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-danger" id="removeSelectedFile">
            <i class="bi bi-trash"></i>
          </button>
        `;
        filePreview.appendChild(previewItem);
      };
      reader.readAsDataURL(file);
    } else {
      previewItem.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="bi ${getFileIcon(file.name)} fs-3 me-3"></i>
          <div>
            <strong>${file.name}</strong><br>
            <span class="text-muted small">${formatFileSize(file.size)}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger" id="removeSelectedFile">
          <i class="bi bi-trash"></i>
        </button>
      `;
      filePreview.appendChild(previewItem);
    }
    
    // Show action buttons
    confirmBtn.classList.remove('d-none');
    removeBtn.classList.remove('d-none');
  }
});

function formatFileSize(bytes) {
  if (typeof bytes === 'string') {
    // Handle case where we get a filename instead of size
    try {
      const stats = fs.statSync(path.join(app.config['UPLOAD_FOLDER'], bytes));
      bytes = stats.size;
    } catch {
      return '';
    }
  }
  
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Add confirm upload handler
// Update the confirm upload handler
document.getElementById('confirmUploadBtn').addEventListener('click', function() {
  const saveStatus = document.getElementById('saveStatus');
  saveStatus.textContent = 'Uploading file...';
  saveStatus.style.color = '';
  
  fileConfirmed = true;
  this.classList.add('d-none');
  document.getElementById('removeFileBtn').classList.add('d-none');
  
  // Immediately save
  saveNote();
});

// Add remove file handler
document.getElementById('removeFileBtn').addEventListener('click', function() {
  document.getElementById('noteFile').value = '';
  document.getElementById('filePreview').innerHTML = '';
  this.classList.add('d-none');
  document.getElementById('confirmUploadBtn').classList.add('d-none');
  fileConfirmed = false;
});


function addNoteToUI(id, title, content) {
  const notesContainer = document.getElementById('notesContainer');
  const newNoteHtml = `
    <div class="col-12 col-md-2 grid-view-item mb-3" data-title="${title.toLowerCase()}" data-time="${Math.floor(Date.now()/1000)}">
      <div class="card position-relative p-3 shadow-sm h-100 d-flex flex-column justify-content-between" 
           data-note-id="${id}">
        <h5 class="card-title">${title}</h5>
        <div class="position-absolute top-0 start-0 p-2 file-indicator d-none"></div>
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
  
  // Immediately check for files
  updateNoteFileIndicator(id, '');
  fetch(`/note/get/${id}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        updateNoteFileIndicator(id, data.note.file_url);
      }
    });
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
    
    // Check if this note has a file (we'll update this after saving)
    const fileIndicator = noteElement.querySelector('.file-indicator');
    if (fileIndicator) {
      fetch(`/note/get/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.note.file_url) {
            fileIndicator.classList.remove('d-none');
          } else {
            fileIndicator.classList.add('d-none');
          }
        });
    }
  }
}
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

  function positionToolbar(card) {
    const rect = card.getBoundingClientRect();
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Center toolbar on mobile
      toolbar.style.left = '50%';
      toolbar.style.top = `${rect.top + window.scrollY - 60}px`;
      toolbar.style.transform = 'translateX(-50%)';
    } else {
      // Position near card on desktop
      toolbar.style.left = `${rect.left + window.scrollX}px`;
      toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
      toolbar.style.transform = 'none';
    }
  }
  // Show the toolbar near the active note
  function showToolbar(card) {
    const rect = card.getBoundingClientRect();
    toolbar.style.left = `${rect.left + window.scrollX}px`;
    toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
    positionToolbar(card);
    toolbar.classList.remove("d-none");
    toolbar.classList.add("d-flex");
  }

  // Update the toolbar content based on the note's pinned status
  function updateToolbarContent(card) {
    const isPinned = card.classList.contains("pinned");
    document.getElementById("pinText").textContent = isPinned ? "Unpin" : "Pin";
    document.getElementById("pinIcon").textContent = isPinned ? "📌" : "📍";
  }

  window.addEventListener('resize', () => {
    if (activeNote) {
      positionToolbar(activeNote);
    }
  });

  // Delete button click handler
  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (activeNote) {
      deleteType = 'note';
      deleteNoteId = activeNote.dataset.noteId;
      document.getElementById('confirmDeleteModalTitle').textContent = 'Delete Note';
      document.getElementById('confirmDeleteModalBody').textContent = 'Are you sure you want to delete this note? This action cannot be undone.';
      const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
      modal.show();
    }
  });

  document.addEventListener('click', function(e) {
  if (e.target.closest('.remove-saved-file')) {
    const button = e.target.closest('.remove-saved-file');
    deleteType = 'file';
    deleteNoteId = button.dataset.noteId;
    deleteFilename = button.dataset.file;
    
    // Update modal content
    document.getElementById('confirmDeleteModalTitle').textContent = 'Delete File';
    document.getElementById('confirmDeleteModalBody').textContent = `Are you sure you want to delete "${deleteFilename.split('_').pop()}"?`;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
  }
  
  // Handle removal of newly selected file (before upload)
  if (e.target.closest('#removeSelectedFile')) {
    document.getElementById('noteFile').value = '';
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('confirmUploadBtn').classList.add('d-none');
    document.getElementById('removeFileBtn').classList.add('d-none');
    fileConfirmed = false;
  }
  });

document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
  
  if (deleteType === 'note') {
    // Handle note deletion
    window.location.href = `/note/delete/${deleteNoteId}`;
  } else if (deleteType === 'file') {
    // Handle file deletion
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.textContent = 'Removing file...';
    saveStatus.className = 'text-muted small';
    
    fetch(`/note/remove_file/${deleteNoteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `filename=${encodeURIComponent(deleteFilename)}`
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        saveStatus.textContent = 'File removed successfully';
        saveStatus.className = 'upload-success small';
        
        // Clear the file preview
        document.getElementById('filePreview').innerHTML = '';
        
        // Hide the remove file button
        document.getElementById('removeFileBtn').classList.add('d-none');
        
        // If no files left, clear the file input
        if (data.remaining_files === 0) {
          document.getElementById('noteFile').value = '';
        }
        
        // Update the note's file indicator in the UI
        updateNoteFileIndicator(deleteNoteId, data.remaining_files > 0 ? 'file_exists' : '');
      } else {
        saveStatus.textContent = 'Error removing file';
        saveStatus.className = 'text-danger small';
      }
      modal.hide();
    })
    .catch(() => {
      saveStatus.textContent = 'Error removing file';
      saveStatus.className = 'text-danger small';
      modal.hide();
    });
  }
  
  // Reset deletion variables
  deleteType = null;
  deleteNoteId = null;
  deleteFilename = null;
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
          location.reload();
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

// Add this at the end of the DOMContentLoaded event listener
document.addEventListener('click', function(e) {
  // Handle removal of newly selected file (before upload)
  if (e.target.closest('#removeSelectedFile')) {
    document.getElementById('noteFile').value = '';
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('confirmUploadBtn').classList.add('d-none');
    document.getElementById('removeFileBtn').classList.add('d-none');
    fileConfirmed = false;
  }
});

  reorderNotes("asc");
});
