import { useEffect } from "react";

const KEYBOARD_OPEN_THRESHOLD_PX = 80;
const FOCUS_PADDING_PX = 28;
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "radio",
  "file",
  "submit",
  "reset",
  "image",
  "range",
  "color",
  "hidden",
]);

function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;

  if (tag === "INPUT") {
    const type = ((target as HTMLInputElement).type || "text").toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(type);
  }

  return false;
}

function findScrollParent(el: HTMLElement): HTMLElement {
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight + 1;

    if (canScroll) return parent;
    parent = parent.parentElement;
  }

  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

function updateVisualViewportVars() {
  const root = document.documentElement;
  const vv = window.visualViewport;

  if (!vv) {
    root.style.setProperty("--vv-height", `${window.innerHeight}px`);
    root.style.setProperty("--vv-top", "0px");
    root.style.setProperty("--keyboard-inset", "0px");
    root.removeAttribute("data-keyboard-open");
    return 0;
  }

  const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  root.style.setProperty("--vv-height", `${Math.round(vv.height)}px`);
  root.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);
  root.style.setProperty("--keyboard-inset", `${inset}px`);

  if (inset >= KEYBOARD_OPEN_THRESHOLD_PX) {
    root.setAttribute("data-keyboard-open", "");
  } else {
    root.removeAttribute("data-keyboard-open");
  }

  return inset;
}

function scrollFocusedIntoVisualViewport(el: HTMLElement) {
  const vv = window.visualViewport;
  if (!vv) {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    return;
  }

  const rect = el.getBoundingClientRect();
  const visibleTop = vv.offsetTop + FOCUS_PADDING_PX;
  const visibleBottom = vv.offsetTop + vv.height - FOCUS_PADDING_PX;

  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) return;

  const targetCenter = vv.offsetTop + vv.height / 2;
  const elementCenter = rect.top + rect.height / 2;
  const delta = elementCenter - targetCenter;
  const scrollParent = findScrollParent(el);

  scrollParent.scrollBy({ top: delta, behavior: "smooth" });

  // Fallback if the parent couldn't move enough (e.g. nested/fixed dialogs).
  requestAnimationFrame(() => {
    const next = el.getBoundingClientRect();
    if (next.top < visibleTop || next.bottom > visibleBottom) {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }
  });
}

/**
 * Keeps focused inputs above the mobile soft keyboard by tracking
 * visualViewport and scrolling the active field into the visible area.
 */
export function useMobileKeyboardAvoidance() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let focusFrame = 0;
    let focusTimer = 0;
    let focusedEl: HTMLElement | null = null;

    const syncViewport = () => {
      updateVisualViewportVars();
      if (focusedEl && document.activeElement === focusedEl) {
        scrollFocusedIntoVisualViewport(focusedEl);
      }
    };

    const scheduleFocusScroll = (el: HTMLElement) => {
      focusedEl = el;
      window.clearTimeout(focusTimer);
      cancelAnimationFrame(focusFrame);

      // First pass after focus; second after keyboard animation (iOS/Android).
      focusFrame = requestAnimationFrame(() => {
        updateVisualViewportVars();
        scrollFocusedIntoVisualViewport(el);
      });
      focusTimer = window.setTimeout(() => {
        updateVisualViewportVars();
        scrollFocusedIntoVisualViewport(el);
      }, 350);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isEditableTarget(event.target)) return;
      scheduleFocusScroll(event.target);
    };

    const onFocusOut = () => {
      focusedEl = null;
      window.clearTimeout(focusTimer);
      cancelAnimationFrame(focusFrame);
      // Allow viewport to settle after keyboard closes.
      window.setTimeout(updateVisualViewportVars, 150);
    };

    updateVisualViewportVars();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncViewport);
    vv?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.clearTimeout(focusTimer);
      cancelAnimationFrame(focusFrame);
      vv?.removeEventListener("resize", syncViewport);
      vv?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.documentElement.style.removeProperty("--vv-height");
      document.documentElement.style.removeProperty("--vv-top");
      document.documentElement.style.removeProperty("--keyboard-inset");
      document.documentElement.removeAttribute("data-keyboard-open");
    };
  }, []);
}
