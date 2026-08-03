export const THEME_COOKIE = "gw-theme";
export const THEME_EVENT = "gw-theme-change";
export const themePreferences = ["auto", "light", "dark"];

export function parseTheme(value) {
  return themePreferences.includes(value) ? value : "auto";
}

export function readThemeCookie(cookie = "") {
  const item = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${THEME_COOKIE}=`));
  return parseTheme(item?.slice(THEME_COOKIE.length + 1));
}

export function resolveTheme(preference, prefersDark) {
  const parsed = parseTheme(preference);
  return parsed === "auto" ? (prefersDark ? "dark" : "light") : parsed;
}

export function themeCookie(preference, hostname = "") {
  const secure = hostname === "greenways.ai" || hostname.endsWith(".greenways.ai");
  const parts = [`${THEME_COOKIE}=${parseTheme(preference)}`, "Path=/", "Max-Age=31536000", "SameSite=Lax"];
  if (secure) parts.push("Domain=greenways.ai", "Secure");
  return parts.join("; ");
}

export function installTheme(root = document.documentElement) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = readThemeCookie(document.cookie);
  if (!document.cookie.includes(`${THEME_COOKIE}=`)) preference = parseTheme(localStorage.getItem(THEME_COOKIE));

  const apply = (next = preference, persist = false) => {
    preference = parseTheme(next);
    const resolvedTheme = resolveTheme(preference, media.matches);
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolvedTheme;
    if (persist) {
      document.cookie = themeCookie(preference, location.hostname);
      localStorage.setItem(THEME_COOKIE, preference);
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { preference, resolvedTheme } }));
    return { preference, resolvedTheme };
  };

  media.addEventListener?.("change", () => preference === "auto" && apply());
  window.GreenwaysTheme = { apply, get preference() { return preference; } };
  return apply();
}

if (typeof window !== "undefined" && typeof document !== "undefined") installTheme();
