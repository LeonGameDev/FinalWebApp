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