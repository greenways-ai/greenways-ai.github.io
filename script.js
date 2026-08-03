const pattern = [
  "0011100",
  "0100010",
  "1000001",
  "1001111",
  "1000001",
  "0100010",
  "0011100",
].join("");
document.querySelector("[data-mark]").replaceChildren(
  ...[...pattern].map((value) => {
    const tile = document.createElement("i");
    tile.dataset.on = value === "1" ? "true" : "false";
    return tile;
  }),
);
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
