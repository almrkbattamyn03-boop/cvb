// Gov Banner Toggle
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("govBannerToggle");
  var content = document.getElementById("govBannerContent");
  if (toggle && content) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      content.hidden = expanded;
      toggle.querySelector(".arrow").textContent = expanded ? "▼" : "▲";
    });
  }

  // Mobile Menu Toggle
  var menuToggle = document.getElementById("mobileMenuToggle");
  var mainNav = document.getElementById("mainNav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      mainNav.classList.toggle("active");
    });
  }
});
