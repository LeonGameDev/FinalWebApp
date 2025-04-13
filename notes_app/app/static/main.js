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
