const themeNames = { auto: "Automatic", light: "Light", dark: "Dark" };
const themeColors = { light: "#f4f2ec", dark: "#050a08" };
const themeMenu = document.querySelector("[data-theme-menu]");
const themeSummary = themeMenu?.querySelector("summary");
const themeColor = document.querySelector('meta[name="theme-color"]');

const syncThemeControls = () => {
  const root = document.documentElement;
  const preference = root.dataset.themePreference || "auto";
  const resolvedTheme = root.dataset.theme || "light";

  themeMenu?.querySelectorAll("[data-theme-choice]").forEach((choice) => {
    choice.setAttribute(
      "aria-checked",
      String(choice.dataset.themeChoice === preference),
    );
  });

  if (themeSummary) {
    themeSummary.setAttribute(
      "aria-label",
      `Choose appearance. Current setting: ${themeNames[preference]}.`,
    );
  }

  if (themeColor) themeColor.setAttribute("content", themeColors[resolvedTheme]);
};

themeMenu?.querySelectorAll("[data-theme-choice]").forEach((choice) => {
  choice.addEventListener("click", () => {
    window.GreenwaysTheme?.apply(choice.dataset.themeChoice, true);
    themeMenu.removeAttribute("open");
  });
});

window.addEventListener("gw-theme-change", syncThemeControls);
syncThemeControls();

const search = document.querySelector("[data-search-dialog]");
const menu = document.querySelector("[data-menu-dialog]");

const openDialog = (dialog) => {
  if (!dialog) return;
  dialog.showModal();
  requestAnimationFrame(() => dialog.querySelector("input,button,a")?.focus());
};

document
  .querySelector("[data-search-open]")
  ?.addEventListener("click", () => openDialog(search));
document
  .querySelector("[data-menu-open]")
  ?.addEventListener("click", () => openDialog(menu));

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openDialog(search);
  }
});

const searchable = [...document.querySelectorAll("[data-search-item]")].map(
  (node) => {
    const title =
      node.querySelector(".project-name,h2,h3")?.textContent?.trim() ||
      node.querySelector("small")?.textContent?.trim() ||
      "Greenways OSS";
    const excerpt =
      node.querySelector(".project-tooltip,p")?.textContent?.trim() || "";
    const href =
      node instanceof HTMLAnchorElement
        ? node.href
        : `${window.location.pathname}#${node.id}`;

    return { href, title, excerpt };
  },
);

const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");

searchInput?.addEventListener("input", (event) => {
  const term = event.target.value.trim().toLowerCase();
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
      const strong = document.createElement("strong");
      const span = document.createElement("span");
      link.href = item.href;
      strong.textContent = item.title;
      span.textContent = item.excerpt;
      link.append(strong, span);
      return link;
    }),
  );

  if (!matches.length) searchResults.innerHTML = "<p>No results found.</p>";
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
  carouselTimer = window.setInterval(() => showSlide(activeSlide + 1), 9000);
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
