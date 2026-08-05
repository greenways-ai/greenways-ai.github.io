const canonicalProjectIcons = new Map([
  ["Hestia", "./hestia/sigil.svg"],
  ["Hoplite", "./hoplite/sigil.svg"],
  ["Historia", "./visual-language/favicons/historia.svg"],
  ["Hodos", "./hodos/sigil.svg"],
  ["Greenways OS", "./visual-language/favicons/greenways.svg"],
  ["Visual Language", "./visual-language/favicons/visual-language.svg"],
]);

document.querySelectorAll(".hero-launcher a").forEach((card) => {
  const name = card.querySelector(".app-name")?.textContent?.trim();
  const source = canonicalProjectIcons.get(name);
  if (source) card.querySelector("img")?.setAttribute("src", source);
});

document.querySelector('link[rel="icon"]')?.setAttribute("href", "./sigil.svg");

const root = document.documentElement;
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeColors = { light: "#f4f2ec", dark: "#050a08" };

const fallbackImageUrl = new URL("./sigil.svg", window.location.href).href;
const installImageFallback = (image) => {
  const useFallback = () => {
    if (image.src === fallbackImageUrl) return;
    image.src = fallbackImageUrl;
    image.classList.add("is-fallback");
  };
  image.addEventListener("error", useFallback, { once: true });
  if (image.complete && image.naturalWidth === 0) useFallback();
};

document
  .querySelectorAll(".gw-header img, .hero-launcher img")
  .forEach(installImageFallback);

const syncThemeColor = () => {
  themeColor?.setAttribute(
    "content",
    themeColors[root.dataset.theme === "dark" ? "dark" : "light"],
  );
};

window.addEventListener("gw-theme-change", syncThemeColor);
syncThemeColor();

// Shared gw-header wiring: search and menu dialogs, ⌘K, and the appearance
// menu, following the visual-language SharedHeader and ThemeMenu contracts.

const header = document.querySelector("[data-gw-header]");
const search = document.querySelector("[data-search-dialog]");
const menu = document.querySelector("[data-menu-dialog]");
const searchInput = search?.querySelector("[data-search-input]");
const searchResults = search?.querySelector("[data-search-results]");

const compactCharterLinks = [
  ["Top", "#top"],
  ["01 · Open by default", "#open-by-default"],
  ["02 · Usable freedom", "#usable-freedom"],
  ["03 · Public stewardship", "#public-stewardship"],
  ["04 · Interoperability", "#interoperability"],
  ["05 · Contributors", "#contributors"],
  ["06 · Sustainability", "#sustainability"],
  ["07 · Identity", "#identity"],
];

const compactMenuNav = menu?.querySelector("nav");
if (compactMenuNav) {
  compactMenuNav.setAttribute("aria-label", "Open Source Charter sections");
  compactMenuNav.replaceChildren(
    ...compactCharterLinks.map(([label, href]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      link.addEventListener("click", () => menu.close());
      return link;
    }),
  );
}

const openDialog = (dialog) => {
  if (!dialog) return;
  dialog.showModal();
  requestAnimationFrame(() =>
    dialog.querySelector("input,button,a")?.focus(),
  );
};

header
  ?.querySelector("[data-search-open]")
  ?.addEventListener("click", () => openDialog(search));
header
  ?.querySelector("[data-menu-open]")
  ?.addEventListener("click", () => openDialog(menu));

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openDialog(search);
  }
});

document.querySelectorAll("[data-theme-menu]").forEach((themeMenu) => {
  const sync = () => {
    const current = root.dataset.themePreference || "auto";
    themeMenu.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.setAttribute(
        "aria-checked",
        String(button.dataset.themeChoice === current),
      );
    });
  };

  themeMenu.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      window.GreenwaysTheme?.apply(button.dataset.themeChoice, true);
      themeMenu.removeAttribute("open");
    });
  });

  window.addEventListener("gw-theme-change", sync);
  sync();
});

header?.querySelectorAll(".gw-project-menu a").forEach((link) => {
  link.addEventListener("click", () =>
    link.closest("details")?.removeAttribute("open"),
  );
});

const searchable = [...document.querySelectorAll("[data-search-item]")].map(
  (node) => {
    const title =
      node.querySelector(".app-name,h2,h3")?.textContent?.trim() ||
      node.querySelector("small")?.textContent?.trim() ||
      "Greenways Open Source";
    const excerpt =
      node.querySelector(".app-description,p")?.textContent?.trim() || "";
    const href =
      node instanceof HTMLAnchorElement
        ? node.href
        : `${window.location.pathname}#${node.id}`;

    return { href, title, excerpt };
  },
);

// Search follows the shared header contract: pagefind when an index exists.
// This site ships no pagefind index, so the local data-search-item index
// keeps search working instead of degrading to "unavailable".

let pagefind;
let pagefindUnavailable = false;

searchInput?.addEventListener("input", async () => {
  const term = searchInput.value.trim();
  if (!searchResults) return;

  if (term.length < 2) {
    searchResults.innerHTML = "<p>Type at least two characters.</p>";
    return;
  }

  if (!pagefind && !pagefindUnavailable) {
    try {
      pagefind = await import("/pagefind/pagefind.js");
    } catch {
      pagefindUnavailable = true;
    }
  }

  if (pagefind) {
    try {
      const found = await pagefind.search(term);
      const entries = await Promise.all(
        found.results.slice(0, 8).map((result) => result.data()),
      );

      searchResults.replaceChildren(
        ...entries.map((entry) => {
          const link = document.createElement("a");
          const title = document.createElement("strong");
          const excerpt = document.createElement("span");

          link.href = entry.url;
          title.textContent = entry.meta?.title || "Result";
          excerpt.innerHTML = entry.excerpt || "";
          link.append(title, excerpt);
          return link;
        }),
      );

      if (!entries.length) {
        searchResults.innerHTML = "<p>No results found.</p>";
      }
      return;
    } catch {
      pagefind = undefined;
      pagefindUnavailable = true;
    }
  }

  const lowered = term.toLowerCase();
  const matches = searchable.filter((item) =>
    `${item.title} ${item.excerpt}`.toLowerCase().includes(lowered),
  );

  searchResults.replaceChildren(
    ...matches.map((item) => {
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const excerpt = document.createElement("span");

      link.href = item.href;
      title.textContent = item.title;
      excerpt.textContent = item.excerpt;
      link.append(title, excerpt);
      return link;
    }),
  );

  if (!matches.length) {
    searchResults.innerHTML = "<p>No results found.</p>";
  }
});

const hero = document.querySelector("[data-hero]");
const heroSlides = [...document.querySelectorAll("[data-hero-art]")];
const heroButtons = [...document.querySelectorAll("[data-hero-slide]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeSlide = 0;
let carouselTimer;

const showSlide = (index) => {
  if (!heroSlides.length) return;

  activeSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeSlide);
  });
  heroButtons.forEach((button, buttonIndex) => {
    button.setAttribute("aria-pressed", String(buttonIndex === activeSlide));
  });
};

const stopCarousel = () => {
  window.clearInterval(carouselTimer);
  carouselTimer = undefined;
};

const startCarousel = () => {
  stopCarousel();
  if (reducedMotion.matches || heroSlides.length < 2) return;

  carouselTimer = window.setInterval(() => {
    showSlide(activeSlide + 1);
  }, 9000);
};

heroButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showSlide(Number(button.dataset.heroSlide));
    startCarousel();
  });
});

hero?.addEventListener("mouseenter", stopCarousel);
hero?.addEventListener("mouseleave", startCarousel);
hero?.addEventListener("focusin", stopCarousel);
hero?.addEventListener("focusout", startCarousel);
reducedMotion.addEventListener?.("change", startCarousel);

showSlide(0);
startCarousel();
