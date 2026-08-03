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

const searchable = [...document.querySelectorAll(".projects a")].map((node) => ({
  href: node.href,
  title: node.querySelector("h3")?.textContent || "Project",
  excerpt: node.querySelector("p")?.textContent || "",
}));

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
