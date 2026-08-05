const installStandardOssHeader = () => {
  const header = document.querySelector("[data-oss-header]");
  if (!header) return;

  header.innerHTML = `
    <details class="oss-header__project-switcher">
      <summary class="oss-header__control" aria-label="Switch Greenways project">
        <img src="./sigil.svg" alt="" aria-hidden="true">
      </summary>
      <nav aria-label="Greenways projects">
        <a href="./" aria-current="page">Open Source</a>
        <a href="./hestia/">Hestia</a>
        <a href="./hoplite/">Hoplite</a>
        <a href="./historia/">Historia</a>
        <a href="./hodos/">Hodos</a>
        <a href="./visual-language/">Visual Language</a>
      </nav>
    </details>
    <a class="oss-header__brand" href="./" aria-label="Greenways Open Source home">
      <span>Open Source</span>
    </a>
    <span class="oss-header__spacer" aria-hidden="true"></span>
    <a class="oss-header__docs" href="./open-source/">Docs</a>
    <button class="oss-header__control" type="button" data-search-open aria-label="Search Greenways Open Source">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.25 4.25"></path></svg>
    </button>
    <button class="oss-header__control oss-header__theme" type="button" data-theme-toggle aria-label="Toggle colour theme" title="Toggle light or dark. Shift-click to follow the system theme.">
      <span class="oss-header__sr">Toggle colour theme</span>
      <svg class="oss-header__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.2A8.4 8.4 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z"></path></svg>
      <svg class="oss-header__sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
    </button>`;

  const style = document.createElement("style");
  style.textContent = `
    .oss-header{grid-template-columns:auto auto 1fr auto auto auto!important}
    .oss-header__spacer{min-width:1px}
    .oss-header__docs{display:grid;place-items:center;align-self:stretch;padding:0 18px;border-left:1px solid var(--gw-line);font:700 10px var(--gw-font-mono);letter-spacing:.12em;text-decoration:none;text-transform:uppercase}
    .oss-header__docs:hover{background:var(--gw-surface-raised);color:var(--gw-accent-2)}
    .oss-header__project-switcher{position:relative;align-self:stretch;display:grid;place-items:center;border-right:1px solid var(--gw-line)}
    .oss-header__project-switcher>summary{width:58px;height:100%;border:0!important;list-style:none}
    .oss-header__project-switcher>summary::-webkit-details-marker{display:none}
    .oss-header__project-switcher>summary img{width:38px;height:38px;display:block;object-fit:contain}
    .oss-header__project-switcher>nav{position:absolute;z-index:120;top:calc(100% + 1px);left:0;min-width:230px;display:grid;padding:8px;background:var(--gw-surface);border:1px solid var(--gw-line-strong);box-shadow:0 24px 64px rgba(0,0,0,.2)}
    .oss-header__project-switcher>nav a{padding:12px 13px;font:700 10px var(--gw-font-mono);letter-spacing:.09em;text-decoration:none;text-transform:uppercase}
    .oss-header__project-switcher>nav a:hover,.oss-header__project-switcher>nav a[aria-current=page]{background:var(--gw-control-hover);color:var(--gw-accent-2)}
    .oss-header__brand{border-right:0!important;padding-inline:18px!important}
    @media(max-width:640px){.oss-header{grid-template-columns:auto auto 1fr auto auto!important}.oss-header__docs{display:none}.oss-header__project-switcher>summary{width:52px}.oss-header__brand{padding-inline:12px!important}}
  `;
  document.head.append(style);

  header.querySelectorAll("details a").forEach((link) => {
    link.addEventListener("click", () => link.closest("details")?.removeAttribute("open"));
  });
};

installStandardOssHeader();

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
const search = document.querySelector("[data-search-dialog]");
const searchInput = search?.querySelector("[data-search-input]");
const searchResults = search?.querySelector("[data-search-results]");
const themeButtons = document.querySelectorAll("[data-theme-toggle]");

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
  .querySelectorAll(".oss-header img, .hero-launcher img")
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
