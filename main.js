/* ============================================================
   Shivang Yadav — portfolio
   Vanilla JS. No dependencies.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Reveal on scroll ---------- */
  var revealables = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealables.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Safety net: if the observer misses an element (fast scrolling, resized
  // viewport, printing), reveal anything that is on screen or already above it.
  var pendingReveal = Array.prototype.slice.call(revealables);

  function flushVisible() {
    if (!pendingReveal.length) return;
    var vh = window.innerHeight;
    pendingReveal = pendingReveal.filter(function (el) {
      var r = el.getBoundingClientRect();
      var visible = r.top < vh * 0.96 && r.bottom > 0;
      var passed = r.bottom <= 0;
      if (visible || passed) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
  }

  window.addEventListener("load", flushVisible);
  window.addEventListener("resize", flushVisible, { passive: true });
  setTimeout(flushVisible, 2200);

  /* ---------- 2. Header state + scroll progress ---------- */
  var header = document.getElementById("site-header");
  var progressBar = document.getElementById("progress-bar");
  var railFill = document.getElementById("rail-fill");
  var toTopBtn = document.getElementById("to-top");
  var ttRing = document.getElementById("tt-ring");
  var ttCirc = 2 * Math.PI * 19;
  var heroSection = document.querySelector(".hero");
  var heroGlow = document.querySelector(".hero-glow");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle("is-stuck", y > 12);

    if (progressBar) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (y / max) * 100 : 0;
      progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
    }

    if (railFill) {
      var rDoc = document.documentElement;
      var rMax = rDoc.scrollHeight - window.innerHeight;
      var rPct = rMax > 0 ? (y / rMax) * 100 : 0;
      railFill.style.height = Math.min(100, Math.max(0, rPct)) + "%";
    }

    updateToTop(y);
    updateParallax(y);
    flushVisible();
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------- 3. Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail-link"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      return { id: id, section: document.getElementById(id) };
    })
    .filter(function (item) { return item.section; });

  function setActiveSection(id) {
    navLinks.forEach(function (l) {
      l.classList.toggle("is-active", l.getAttribute("href") === "#" + id);
    });
    railLinks.forEach(function (l) {
      var match = l.getAttribute("href") === "#" + id;
      if (match && !l.classList.contains("is-active")) {
        l.classList.remove("is-active");
        // restart the label animation on every change
        void l.offsetWidth;
      }
      l.classList.toggle("is-active", match);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = sections.filter(function (s) { return s.section === entry.target; })[0];
          if (match) setActiveSection(match.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s.section); });
  }

  // clear the rail once the hero is back in view
  if ("IntersectionObserver" in window) {
    var heroEl = document.getElementById("top");
    if (heroEl) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("is-active"); });
          railLinks.forEach(function (l) { l.classList.remove("is-active"); });
        }
      }, { rootMargin: "-20% 0px -60% 0px" }).observe(heroEl);
    }
  }

  /* ---------- 4. Mobile menu ---------- */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");

  function closeMenu() {
    if (!toggle || !nav) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- 5. Typing effect in the terminal ---------- */
  var typedEl = document.getElementById("typed");
  var phrases = [
    "things that ship",
    "desktop apps in Python",
    "small, fast web tools",
    "tools that do one thing well"
  ];

  if (typedEl) {
    if (reduceMotion) {
      typedEl.textContent = phrases[0];
    } else {
      var phraseIndex = 0;
      var charIndex = 0;
      var deleting = false;

      var tick = function () {
        var phrase = phrases[phraseIndex];

        if (!deleting) {
          charIndex++;
          typedEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === phrase.length) {
            deleting = true;
            setTimeout(tick, 1700);
            return;
          }
          setTimeout(tick, 55 + Math.random() * 45);
        } else {
          charIndex--;
          typedEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(tick, 320);
            return;
          }
          setTimeout(tick, 26);
        }
      };

      setTimeout(tick, 700);
    }
  }

  /* ---------- 6. Copy email ---------- */
  var copyBtn = document.getElementById("copy-email");

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      var done = function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = "Copied ✓";
        copyBtn.classList.add("is-done");
        setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.classList.remove("is-done");
        }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(fallback);
      } else {
        fallback();
      }

      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = email;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (err) { /* silent */ }
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- 7. Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 8. Subtle pointer glow on the hero ---------- */
  var hero = document.querySelector(".hero");
  var glow = document.querySelector(".hero-glow");

  if (hero && glow && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.background =
        "radial-gradient(38% 45% at " + x + "% " + y + "%, rgba(125,240,180,0.13), transparent 70%)," +
        "radial-gradient(34% 40% at " + (x + 18) + "% " + (y + 8) + "%, rgba(139,124,255,0.11), transparent 70%)";
    });
  }

  /* ---------- 9. Pointer spotlight on project cards ---------- */
  var projectCards = document.querySelectorAll(".project");

  if (projectCards.length && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    projectCards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ---------- 10. Back to top ---------- */
  if (ttRing) {
    ttRing.style.strokeDasharray = String(ttCirc);
    ttRing.style.strokeDashoffset = String(ttCirc);
  }

  function updateToTop(y) {
    if (!toTopBtn) return;
    toTopBtn.classList.toggle("is-visible", y > 520);
    if (ttRing) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      ttRing.style.strokeDashoffset = String(ttCirc * (1 - p));
    }
  }

  if (toTopBtn) {
    toTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- 11. Gentle parallax on the hero glow ---------- */
  function updateParallax(y) {
    if (!heroGlow || reduceMotion || y > window.innerHeight * 1.2) return;
    heroGlow.style.transform = "translateX(-50%) translateY(" + (y * 0.12).toFixed(1) + "px)";
  }

  updateToTop(window.scrollY || 0);
  updateParallax(window.scrollY || 0);

})();
