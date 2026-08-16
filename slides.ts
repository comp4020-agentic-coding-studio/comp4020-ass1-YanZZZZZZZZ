const SLIDE_IDS = ["hero", "act-1", "act-2", "act-3"] as const;

export function initSlides(): void {
  const main = document.querySelector("main");
  const dots = document.querySelectorAll<HTMLButtonElement>(".slide-dot");
  if (!main || dots.length === 0) return;

  const sections = SLIDE_IDS.map((id) => document.getElementById(id)).filter(
    (el): el is HTMLElement => el !== null,
  );

  const setCurrent = (id: string) => {
    dots.forEach((dot) => {
      dot.setAttribute("aria-current", String(dot.dataset.slide === id));
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setCurrent(visible.target.id);
    },
    { root: main, threshold: 0.6 },
  );
  sections.forEach((section) => observer.observe(section));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = dot.dataset.slide
        ? document.getElementById(dot.dataset.slide)
        : null;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (sections[0]) setCurrent(sections[0].id);
}
