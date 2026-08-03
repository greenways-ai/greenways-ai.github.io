const labels = { auto: "Auto", light: "Light", dark: "Dark" };
const themeMenu = document.querySelector(".gw-theme-menu");
const sync = () => {
  const preference = document.documentElement.dataset.themePreference || "auto";
  document.querySelector("[data-theme-label]").textContent = labels[preference];
  document.querySelectorAll("[data-theme-choice]").forEach((choice) =>
    choice.setAttribute("aria-checked", String(choice.dataset.themeChoice === preference)),
  );
};
document.querySelectorAll("[data-theme-choice]").forEach((choice) => choice.addEventListener("click", () => {
  window.GreenwaysTheme?.apply(choice.dataset.themeChoice, true);
  themeMenu.removeAttribute("open");
}));
window.addEventListener("gw-theme-change", sync);
sync();

const search = document.querySelector("[data-search-dialog]");
const menu = document.querySelector("[data-menu-dialog]");
const openDialog = (dialog) => { dialog.showModal(); requestAnimationFrame(() => dialog.querySelector("input,button,a")?.focus()); };
document.querySelector("[data-search-open]").addEventListener("click", () => openDialog(search));
document.querySelector("[data-menu-open]").addEventListener("click", () => openDialog(menu));
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openDialog(search); }
});
const searchable = [...document.querySelectorAll(".projects a")].map((node) => ({
  href: node.href, title: node.querySelector("h3").textContent, excerpt: node.querySelector("p").textContent,
}));
document.querySelector("[data-search-input]").addEventListener("input", (event) => {
  const term = event.target.value.trim().toLowerCase();
  const results = document.querySelector("[data-search-results]");
  if (term.length < 2) { results.innerHTML = "<p>Type at least two characters.</p>"; return; }
  const matches = searchable.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(term));
  results.replaceChildren(...matches.map((item) => {
    const link = document.createElement("a"); const strong = document.createElement("strong"); const span = document.createElement("span");
    link.href = item.href; strong.textContent = item.title; span.textContent = item.excerpt; link.append(strong, span); return link;
  }));
  if (!matches.length) results.innerHTML = "<p>No results found.</p>";
});
