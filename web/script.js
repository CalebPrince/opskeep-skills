(function () {
  "use strict";

  // ---- theme toggle ----
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = null;
  try { stored = localStorage.getItem("opskeep-theme"); } catch (e) {}
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("opskeep-theme", next); } catch (e) {}
    });
  }

  // ---- skill directory tabs ----
  var tabs = document.querySelectorAll(".tab");
  var cards = document.querySelectorAll(".skill-card");

  function activateFilter(filter) {
    tabs.forEach(function (t) {
      var isMatch = t.getAttribute("data-filter") === filter;
      t.classList.toggle("is-active", isMatch);
      t.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
    cards.forEach(function (card) {
      card.hidden = !(filter === "all" || card.getAttribute("data-cat") === filter);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activateFilter(tab.getAttribute("data-filter"));
    });
  });

  // ---- "view all" + card deep-links into the directory ----
  var viewAllBtn = document.getElementById("view-all-btn");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", function () {
      activateFilter("all");
      document.getElementById("directory").scrollIntoView({ behavior: "smooth" });
    });
  }
  document.querySelectorAll("[data-filter-link]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      activateFilter(el.getAttribute("data-filter-link"));
      document.getElementById("directory").scrollIntoView({ behavior: "smooth" });
    });
  });

  // ---- copy install command ----
  var copyBtn = document.querySelector(".copy-btn");
  if (copyBtn) {
    var originalMarkup = copyBtn.innerHTML;
    var checkMarkup = '<svg class="icon" viewBox="0 0 24 24"><use href="#i-check"></use></svg>';
    copyBtn.addEventListener("click", function () {
      var text = copyBtn.getAttribute("data-copy") || "";
      var done = function () {
        copyBtn.innerHTML = checkMarkup;
        copyBtn.classList.add("copied");
        setTimeout(function () {
          copyBtn.innerHTML = originalMarkup;
          copyBtn.classList.remove("copied");
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }
})();
