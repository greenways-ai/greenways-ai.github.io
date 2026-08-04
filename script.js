const themeColors = {
  light: "#edf9f6",
  dark: "#041112",
};

const themeColor = document.querySelector('meta[name="theme-color"]');
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = document.querySelector("[data-theme-icon]");
const themeLabel = document.querySelector("[data-theme-label]");

const syncThemeControl = () => {
  const resolvedTheme = document.documentElement.dataset.theme || "light";
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} theme`;

  themeToggle?.setAttribute("aria-label", label);
  if (themeLabel) themeLabel.textContent = label;
  if (themeIcon) themeIcon.textContent = resolvedTheme === "dark" ? "☀" : "☾";
  themeColor?.setAttribute("content", themeColors[resolvedTheme]);
};

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  window.GreenwaysTheme?.apply(nextTheme, true);
});

window.addEventListener("gw-theme-change", syncThemeControl);
syncThemeControl();

const menu = document.querySelector("[data-menu-dialog]");
const openDialog = (dialog) => {
  if (!dialog) return;
  dialog.showModal();
  requestAnimationFrame(() => dialog.querySelector("button,a")?.focus());
};

document
  .querySelector("[data-menu-open]")
  ?.addEventListener("click", () => openDialog(menu));

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => menu.close());
});

const carousel = document.querySelector("[data-world-carousel]");
const slides = [...document.querySelectorAll("[data-world-slide]")];
const dots = [...document.querySelectorAll("[data-carousel-dot]")];
const caption = document.querySelector("[data-carousel-caption]");
const count = document.querySelector("[data-carousel-count]");
const status = document.querySelector("[data-carousel-status]");
const previous = document.querySelector("[data-carousel-previous]");
const next = document.querySelector("[data-carousel-next]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeIndex = 0;
let autoplayTimer = null;
let carouselPaused = false;

const normaliseIndex = (index) => (index + slides.length) % slides.length;

const showSlide = (index, announce = true) => {
  if (!slides.length) return;

  activeIndex = normaliseIndex(index);

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeIndex;
    dot.classList.toggle("is-active", isActive);
    if (isActive) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });

  const title = slides[activeIndex].dataset.title || "Connected world";
  const position = String(activeIndex + 1).padStart(2, "0");
  const total = String(slides.length).padStart(2, "0");

  if (caption) caption.textContent = title;
  if (count) count.textContent = `${position} / ${total}`;
  if (announce && status) {
    status.textContent = `Showing ${title}, slide ${activeIndex + 1} of ${slides.length}.`;
  }
};

const stopAutoplay = () => {
  if (autoplayTimer) window.clearInterval(autoplayTimer);
  autoplayTimer = null;
};

const startAutoplay = () => {
  stopAutoplay();
  if (reduceMotion.matches || carouselPaused || document.hidden || slides.length < 2) {
    return;
  }
  autoplayTimer = window.setInterval(() => showSlide(activeIndex + 1, false), 8000);
};

previous?.addEventListener("click", () => {
  showSlide(activeIndex - 1);
  startAutoplay();
});

next?.addEventListener("click", () => {
  showSlide(activeIndex + 1);
  startAutoplay();
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showSlide(Number(dot.dataset.carouselDot));
    startAutoplay();
  });
});

carousel?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showSlide(activeIndex - 1);
    startAutoplay();
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    showSlide(activeIndex + 1);
    startAutoplay();
  }
});

carousel?.addEventListener("pointerenter", () => {
  carouselPaused = true;
  stopAutoplay();
});

carousel?.addEventListener("pointerleave", () => {
  carouselPaused = false;
  startAutoplay();
});

carousel?.addEventListener("focusin", () => {
  carouselPaused = true;
  stopAutoplay();
});

carousel?.addEventListener("focusout", (event) => {
  if (carousel.contains(event.relatedTarget)) return;
  carouselPaused = false;
  startAutoplay();
});

document.addEventListener("visibilitychange", startAutoplay);
reduceMotion.addEventListener?.("change", startAutoplay);

showSlide(0, false);
startAutoplay();
