// Shared by every page.
//
// 1. The Phone / PC switch of the home page.
// 2. The store links. The HTML ships them as "coming soon" (no link), and
//    assets/data/platforms.json says where the game is out. A scheduled GitHub
//    Action (.github/workflows/platforms.yml) flips a platform to live in that
//    file once its store page is public, so the buttons follow on their own.
//
// Markup of a store link:
//   data-platform="steam"         which platform it is (a key of platforms.json)
//   data-live="..." data-soon="..." on the element or a child: text for each state
//   data-hide-soon                hide the element while the platform is not out
(function () {
  var root = document.documentElement;

  // Phone / PC switch
  var viewButtons = document.querySelectorAll("[data-set-view]");
  function syncView() {
    viewButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.setView === root.dataset.view));
    });
  }
  viewButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      root.dataset.view = b.dataset.setView;
      try { localStorage.setItem("view", root.dataset.view); } catch (e) {}
      syncView();
    });
  });
  syncView();

  // Store links
  var script = document.currentScript;
  var dataUrl = new URL("../data/platforms.json", script ? script.src : location.href);

  function isLive(p) { return !!(p && p.live && p.url); }

  function applyPlatform(el, p) {
    var live = isLive(p);
    if (live) {
      el.setAttribute("href", p.url);
      el.removeAttribute("aria-disabled");
    } else {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
    }
    el.classList.toggle("soon", !live);
    if (el.hasAttribute("data-hide-soon")) el.hidden = !live;

    var labels = el.matches("[data-live]") ? [el] : el.querySelectorAll("[data-live]");
    labels.forEach(function (label) {
      var text = live ? label.dataset.live : label.dataset.soon;
      if (text) label.textContent = text;
    });
  }

  function mobileAvailability(platforms) {
    var ios = isLive(platforms.appstore);
    var android = isLive(platforms.googleplay);
    if (ios && android) return "On the App Store and Google Play.";
    if (ios) return "On the App Store. Coming soon on Google Play.";
    if (android) return "On Google Play. Coming soon on the App Store.";
    return "iPhone, iPad and Android. Coming soon.";
  }

  function apply(platforms) {
    document.querySelectorAll("[data-platform]").forEach(function (el) {
      if (el.dataset.platform in platforms) applyPlatform(el, platforms[el.dataset.platform]);
    });
    document.querySelectorAll("[data-mobile-avail]").forEach(function (el) {
      el.textContent = mobileAvailability(platforms);
    });
  }

  if (!document.querySelector("[data-platform], [data-mobile-avail]") || !window.fetch) return;
  fetch(dataUrl, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(apply)
    .catch(function () { /* Keep the HTML as shipped: "coming soon". */ });
})();
