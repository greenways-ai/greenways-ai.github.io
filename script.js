const root = document.documentElement;
const themeColor = document.querySelector('meta[name="theme-color"]');
const search = document.querySelector("[data-search-dialog]");
const searchInput = search?.querySelector("[data-search-input]");
const searchResults = search?.querySelector("[data-search-results]");
const themeButtons = document.querySelectorAll("[data-theme-toggle]");

const themeColors = { light: "#f4f2ec", dark: "#050a08" };

const fallbackImageUrl = new URL("./favicon.svg", window.location.href).href;
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
  .querySelectorAll(".oss-header__sigil, .hero-launcher img")
  .forEach(installImageFallback);

const renderTheme = () => {
  const dark = root.dataset.theme === "dark";

  themeButtons.forEach((button) => {
    button.setAttribute(
      "aria-label",
      dark ? "Switch to light theme" : "Switch to dark theme",
    );
    button.setAttribute("aria-pressed", String(dark));
  });

  themeColor?.setAttribute("content", themeColors[dark ? "dark" : "light"]);
};

const fallbackApply = (preference) => {
  const dark =
    preference === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : preference === "dark";

  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePreference = preference;
  root.style.colorScheme = dark ? "dark" : "light";

  try {
    localStorage.setItem("gw-theme", preference);
  } catch {
    // Theme persistence is optional.
  }

  window.dispatchEvent(
    new CustomEvent("gw-theme-change", {
      detail: { preference, theme: dark ? "dark" : "light" },
    }),
  );
};

themeButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const current = root.dataset.theme === "dark" ? "dark" : "light";
    const next = event.shiftKey ? "auto" : current === "dark" ? "light" : "dark";
    const theme = window.GreenwaysTheme;

    if (theme?.apply) {
      theme.apply(next, true);
    } else {
      fallbackApply(next);
    }

    renderTheme();
  });
});

window.addEventListener("gw-theme-change", renderTheme);
renderTheme();

const openSearch = () => {
  if (!search) return;
  search.showModal();
  requestAnimationFrame(() => searchInput?.focus());
};

document
  .querySelectorAll("[data-search-open]")
  .forEach((button) => button.addEventListener("click", openSearch));

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});

document.querySelectorAll(".oss-header__menu a").forEach((link) => {
  link.addEventListener("click", () => {
    link.closest("details")?.removeAttribute("open");
  });
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

searchInput?.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  if (!searchResults) return;

  if (term.length < 2) {
    searchResults.innerHTML = "<p>Type at least two characters.</p>";
    return;
  }

  const matches = searchable.filter((item) =>
    `${item.title} ${item.excerpt}`.toLowerCase().includes(term),
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
