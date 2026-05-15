import "./style.css";
import "./stars.css";
import "./stars-twinkling.css";
import "./card.css";
import "./code-window.css";

const initViewSwitching = () => {
  const views = Array.from(
    document.querySelectorAll<HTMLElement>("[data-view]"),
  );
  const triggers = Array.from(
    document.querySelectorAll<HTMLElement>("[data-view-trigger]"),
  );

  if (!views.length || !triggers.length) {
    return;
  }

  const showView = (viewName: string) => {
    views.forEach((view) => {
      view.hidden = view.dataset.view !== viewName;
    });
  };

  showView("home");

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();

      const targetView = trigger.dataset.viewTrigger;
      if (!targetView) {
        return;
      }

      showView(targetView);
      const listToggle = document.getElementById(
        "cui-nav-list",
      ) as HTMLInputElement | null;
      const simpleToggle = document.getElementById(
        "cui-nav-simple",
      ) as HTMLInputElement | null;

      if (listToggle) {
        listToggle.checked = false;
      }
      if (simpleToggle) {
        simpleToggle.checked = false;
      }
    });
  });
};

if (document.getElementById("canvas")) {
  import("./waves.ts").then(({ initWaves }) => {
    initWaves("canvas");
  });
}

initViewSwitching();
