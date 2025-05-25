console.log("App loaded");
const themeToggle = document.getElementById("themeToggle");
const pageBody = document.getElementById("pageBody");

if (themeToggle && pageBody) {
  // Load theme from localStorage
  if (localStorage.getItem("theme") === "dark") {
    pageBody.classList.replace("bg-light", "bg-dark");
    pageBody.classList.replace("text-dark", "text-light");
  }

  themeToggle.addEventListener("click", () => {
    const isDark = pageBody.classList.contains("bg-dark");

    if (isDark) {
      pageBody.classList.replace("bg-dark", "bg-light");
      pageBody.classList.replace("text-light", "text-dark");
      localStorage.setItem("theme", "light");
    } else {
      pageBody.classList.replace("bg-light", "bg-dark");
      pageBody.classList.replace("text-dark", "text-light");
      localStorage.setItem("theme", "dark");
    }
  });
}

// Layout switching functionality
const gridViewBtn = document.getElementById("gridViewBtn");
const listViewBtn = document.getElementById("listViewBtn");
const notesContainer = document.getElementById("notesContainer");

if (gridViewBtn && listViewBtn && notesContainer) {
  // Set initial layout based on localStorage or default to grid view
  if (localStorage.getItem("layout") === "list") {
    notesContainer.classList.add("list-view");
    notesContainer.classList.remove("grid-view");
  } else {
    notesContainer.classList.add("grid-view");
    notesContainer.classList.remove("list-view");
  }

  // Switch to grid view
  gridViewBtn.addEventListener("click", () => {
    notesContainer.classList.add("grid-view");
    notesContainer.classList.remove("list-view");
    localStorage.setItem("layout", "grid");
  });

  // Switch to list view
  listViewBtn.addEventListener("click", () => {
    notesContainer.classList.add("list-view");
    notesContainer.classList.remove("grid-view");
    localStorage.setItem("layout", "list");
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const fontSizeInput = document.getElementById('fontSizeInput');

  // Load saved font size
  const savedSize = localStorage.getItem('noteFontSize') || '18';
  document.documentElement.style.setProperty('--note-font-size', `${savedSize}px`);
  fontSizeInput.value = savedSize;

  // Update font size on Enter key
  fontSizeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const size = parseInt(fontSizeInput.value, 10);
      if (!isNaN(size)) {
        const clamped = Math.max(10, Math.min(36, size));
        fontSizeInput.value = clamped;
        document.documentElement.style.setProperty('--note-font-size', `${clamped}px`);
        localStorage.setItem('noteFontSize', clamped);
        fontSizeInput.blur();
      }
    }
  });

  // Create color picker window if it doesn't exist
  let pickerWindow = document.querySelector('.color-picker-window');
  if (!pickerWindow) {
    pickerWindow = document.createElement('div');
    pickerWindow.className = 'color-picker-window';
    pickerWindow.innerHTML = `
      <div class="color-picker-header">
        <button class="close-picker">×</button>
      </div>
      <input type="color" class="hidden-color-input">
    `;
    document.body.appendChild(pickerWindow);
  }

  const header = pickerWindow.querySelector('.color-picker-header');
  const closeBtn = pickerWindow.querySelector('.close-picker');
  const colorInput = pickerWindow.querySelector('.hidden-color-input');

  // Track which card is being colored
  let currentCard = null;

  document.querySelectorAll('.color-palette').forEach(button => {
    button.addEventListener('click', (e) => {
      currentCard = button.closest('.card');
      pickerWindow.style.display = 'block';
      
      // Position near the clicked button
      const rect = button.getBoundingClientRect();
      pickerWindow.style.left = `${rect.left}px`;
      pickerWindow.style.top = `${rect.bottom + 5}px`;
      
      e.stopPropagation();
    });
  });

  // Update card color when a color is picked
  colorInput.addEventListener('input', () => {
    if (currentCard) {
      const color = colorInput.value;
      currentCard.style.backgroundColor = color;
  
      const noteId = currentCard.getAttribute('data-note-id');
      fetch(`/note/color/${noteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
      });
    }
  });  

  // Close window
  closeBtn.addEventListener('click', () => {
    pickerWindow.style.display = 'none';
  });

  // --- Dragging Logic ---
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    offsetX = e.clientX - pickerWindow.getBoundingClientRect().left;
    offsetY = e.clientY - pickerWindow.getBoundingClientRect().top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    pickerWindow.style.left = `${e.clientX - offsetX}px`;
    pickerWindow.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!pickerWindow.contains(e.target)) {
      pickerWindow.style.display = 'none';
    }
  });
});

// Your existing view toggle functionality can remain
document.getElementById('gridViewBtn').addEventListener('click', function() {
  document.getElementById('notesContainer').classList.add('grid-view');
  document.getElementById('notesContainer').classList.remove('list-view');
});

document.getElementById('listViewBtn').addEventListener('click', function() {
  document.getElementById('notesContainer').classList.add('list-view');
  document.getElementById('notesContainer').classList.remove('grid-view');
});


