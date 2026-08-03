const button = document.querySelector("[data-theme-button]");
const labels = { auto: "Auto", light: "Light", dark: "Dark" };
const sync = () =>
  (button.textContent =
    labels[document.documentElement.dataset.themePreference || "auto"]);
button.addEventListener("click", (event) => {
  const current = document.documentElement.dataset.theme || "dark";
  window.GreenwaysTheme?.apply(
    event.shiftKey ? "auto" : current === "dark" ? "light" : "dark",
    true,
  );
});
window.addEventListener("gw-theme-change", sync);
sync();
