const selectorStyles = document.createElement("link");
selectorStyles.rel = "stylesheet";
selectorStyles.href = "./selector.css?v=sigil-selector-20260805";
document.head.append(selectorStyles);

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
  .querySelectorAll(".gw-header img, [data-active-sigil], .project-choice img")
  .forEach(installImageFallback);

const syncThemeColor = () => {
  themeColor?.setAttribute(
    "content",
    themeColors[root.dataset.theme === "dark" ? "dark" : "light"],
  );
};

window.addEventListener("gw-theme-change", syncThemeColor);
syncThemeColor();

const header = document.querySelector("[data-gw-header]");
const search = document.querySelector("[data-search-dialog]");
const menu = document.querySelector("[data-menu-dialog]");
const searchInput = search?.querySelector("[data-search-input]");
const searchResults = search?.querySelector("[data-search-results]");

const openDialog = (dialog) => {
  if (!dialog) return;
  dialog.showModal();
  requestAnimationFrame(() => dialog.querySelector("input,button,a")?.focus());
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

menu?.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", () => menu.close());
});

const searchable = [...document.querySelectorAll("[data-search-item]")].map(
  (node) => {
    const title =
      node.querySelector(".app-name,h2,h3")?.textContent?.trim() ||
      node.querySelector("small")?.textContent?.trim() ||
      "Greenways Open Source";
    const excerpt =
      node.dataset.description ||
      node.querySelector(".app-description,p")?.textContent?.trim() ||
      "";
    const href =
      node.dataset.href ||
      (node instanceof HTMLAnchorElement
        ? node.href
        : `${window.location.pathname}#${node.id}`);

    return { href, title, excerpt };
  },
);

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
      if (!entries.length) searchResults.innerHTML = "<p>No results found.</p>";
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
  if (!matches.length) searchResults.innerHTML = "<p>No results found.</p>";
});

const hero = document.querySelector("[data-hero]");
const projectChoices = [...document.querySelectorAll("[data-project-select]")];
const backgroundLayers = [...document.querySelectorAll("[data-hero-art]")];
const activeSigil = document.querySelector("[data-active-sigil]");
const activeIndex = document.querySelector("[data-active-index]");
const activeName = document.querySelector("[data-active-name]");
const activeDescription = document.querySelector("[data-active-description]");
const activeLink = document.querySelector("[data-active-link]");
const projectStage = document.querySelector(".project-stage");
const mobileArtwork = window.matchMedia("(max-width: 760px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeChoice = projectChoices[0];
let backgroundCursor = 0;
let stageTimer;

const artworkFor = (choice, mode) => {
  const mobileKey = mode === "light" ? "artLightMobile" : "artDarkMobile";
  const desktopKey = mode === "light" ? "artLight" : "artDark";
  return mobileArtwork.matches && choice.dataset[mobileKey]
    ? choice.dataset[mobileKey]
    : choice.dataset[desktopKey];
};

const applyBackground = (choice, immediate = false) => {
  if (!backgroundLayers.length) return;
  const nextIndex = immediate
    ? 0
    : (backgroundCursor + 1) % backgroundLayers.length;
  const nextLayer = backgroundLayers[nextIndex];
  const light = artworkFor(choice, "light");
  const dark = artworkFor(choice, "dark");
  nextLayer.style.setProperty("--gw-art-light", `url("${light}")`);
  nextLayer.style.setProperty("--gw-art-dark", `url("${dark}")`);
  nextLayer.style.setProperty("--gw-art-light-position", "center");
  nextLayer.style.setProperty("--gw-art-dark-position", "center");
  requestAnimationFrame(() => {
    backgroundLayers.forEach((layer) =>
      layer.classList.toggle("is-active", layer === nextLayer),
    );
  });
  backgroundCursor = nextIndex;
};

const setExternalLinkState = (link, href) => {
  try {
    const url = new URL(href, window.location.href);
    const external = url.origin !== window.location.origin;
    if (external) {
      link.target = "_blank";
      link.rel = "noreferrer";
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  } catch {
    link.removeAttribute("target");
    link.removeAttribute("rel");
  }
};

const activateProject = (choice, { immediate = false } = {}) => {
  if (!choice) return;
  activeChoice = choice;
  const { project, name, index, href, icon, description, accent, glow } =
    choice.dataset;

  hero.dataset.activeProject = project;
  hero.style.setProperty("--project-accent", accent);
  hero.style.setProperty("--project-glow", glow);
  projectChoices.forEach((item) => {
    const selected = item === choice;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });

  activeSigil.src = icon;
  activeSigil.alt = `${name} sigil`;
  activeIndex.textContent = `${index} / ${String(projectChoices.length).padStart(2, "0")}`;
  activeName.textContent = name;
  activeDescription.textContent = description;
  activeLink.href = href;
  activeLink.textContent = `Open ${name} →`;
  setExternalLinkState(activeLink, href);
  applyBackground(choice, immediate);

  window.clearTimeout(stageTimer);
  projectStage?.classList.remove("is-switching");
  if (!reducedMotion.matches) {
    requestAnimationFrame(() => projectStage?.classList.add("is-switching"));
    stageTimer = window.setTimeout(
      () => projectStage?.classList.remove("is-switching"),
      420,
    );
  }
};

projectChoices.forEach((choice, choiceIndex) => {
  choice.addEventListener("pointerenter", () => activateProject(choice));
  choice.addEventListener("focus", () => activateProject(choice));
  choice.addEventListener("click", () => activateProject(choice));
  choice.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = choiceIndex;
    if (event.key === "ArrowLeft") nextIndex = (choiceIndex - 1 + projectChoices.length) % projectChoices.length;
    if (event.key === "ArrowRight") nextIndex = (choiceIndex + 1) % projectChoices.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = projectChoices.length - 1;
    projectChoices[nextIndex].focus();
  });
});

mobileArtwork.addEventListener?.("change", () => applyBackground(activeChoice, true));
activateProject(activeChoice, { immediate: true });
