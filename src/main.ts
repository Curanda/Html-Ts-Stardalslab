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

  if (!views.length) {
    return;
  }

  const normalizePath = (path: string) => {
    const trimmed = path.replace(/\/+$/, "");
    return trimmed || "/";
  };

  const routeToView: Record<string, string> = {
    "/": "home",
    "/somewhereprivacy": "somewhereprivacy",
    "/somwhereprivacy": "somewhereprivacy",
  };

  const viewToRoute: Record<string, string> = {
    home: "/",
    somewhereprivacy: "/somewhereprivacy",
  };

  const showView = (viewName: string) => {
    const hasMatchingView = views.some(
      (view) => view.dataset.view === viewName,
    );
    const nextView = hasMatchingView ? viewName : "home";

    views.forEach((view) => {
      view.hidden = view.dataset.view !== nextView;
    });

    return nextView;
  };

  const syncPathForView = (viewName: string) => {
    const targetPath = viewToRoute[viewName] ?? "/";

    if (normalizePath(window.location.pathname) === targetPath) {
      return;
    }

    window.history.pushState(
      null,
      "",
      `${targetPath}${window.location.search}`,
    );
  };

  const applyViewFromPath = () => {
    const normalizedPath = normalizePath(window.location.pathname);
    const pathView = routeToView[normalizedPath] ?? "home";
    showView(pathView);
  };

  applyViewFromPath();

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();

      const targetView = trigger.dataset.viewTrigger;
      if (!targetView) {
        return;
      }

      const activeView = showView(targetView);
      syncPathForView(activeView);

      const listToggle = document.getElementById(
        "cui-nav-list",
      ) as HTMLInputElement | null;
      const simpleToggle = document.getElementById(
        "cui-nav-simple",
      ) as HTMLInputElement | null;
      const mobileToggle = document.getElementById(
        "cui-nav-mobile",
      ) as HTMLInputElement | null;

      if (listToggle) {
        listToggle.checked = false;
      }
      if (simpleToggle) {
        simpleToggle.checked = false;
      }
      if (mobileToggle) {
        mobileToggle.checked = false;
      }
    });
  });

  window.addEventListener("popstate", applyViewFromPath);
};

if (document.getElementById("canvas")) {
  import("./waves.ts").then(({ initWaves }) => {
    initWaves("canvas");
  });
}

initViewSwitching();
