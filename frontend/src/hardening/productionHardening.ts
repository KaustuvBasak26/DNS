export const HARDENING_CLASS = "prod-hardened";

export function isLocalDevHost(hostname = ""): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/** Production build on a public host (Render, custom domain). Skips localhost preview. */
export function shouldApplyHardening(
  prod = import.meta.env.PROD,
  hostname = typeof location !== "undefined" ? location.hostname : "",
): boolean {
  return prod && !isLocalDevHost(hostname);
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  let el: HTMLElement | null = target;
  while (el && el !== document.documentElement) {
    const ce = el.getAttribute("contenteditable");
    if (ce === "true") return true;
    if (ce === "false") return false;
    el = el.parentElement;
  }
  return false;
}

export function isExemptFromCopyBlock(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (isEditableTarget(target)) return true;
  return !!target.closest(".allow-select");
}

export function shouldBlockKeyDown(
  key: string,
  modifiers: { ctrl: boolean; meta: boolean; shift: boolean; alt: boolean },
  editable: boolean,
): boolean {
  if (editable) return false;

  const k = key.toLowerCase();
  const mod = modifiers.ctrl || modifiers.meta;

  if (k === "f12") return true;

  if (!mod) return false;

  if (modifiers.shift && (k === "i" || k === "j" || k === "c")) return true;

  // macOS: Option+Cmd+I/J/C (Inspect)
  if (modifiers.meta && modifiers.alt && (k === "i" || k === "j" || k === "c")) {
    return true;
  }

  if (k === "u" || k === "s" || k === "p") return true;

  if (k === "c" || k === "a" || k === "x") return true;

  return false;
}

function blockUnlessExempt(event: Event): void {
  if (isExemptFromCopyBlock(event.target)) return;
  event.preventDefault();
}

function onKeyDown(event: KeyboardEvent): void {
  if (
    shouldBlockKeyDown(
      event.key,
      {
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
      },
      isEditableTarget(event.target),
    )
  ) {
    event.preventDefault();
  }
}

function onSelectionChange(): void {
  if (isEditableTarget(document.activeElement)) return;
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed) sel.removeAllRanges();
}

function onBeforePrint(event: Event): void {
  event.preventDefault();
}

let installed = false;

export function installProductionHardening(): () => void {
  if (!shouldApplyHardening() || installed) return () => undefined;
  installed = true;

  document.documentElement.classList.add(HARDENING_CLASS);

  const options: AddEventListenerOptions = { capture: true };

  document.addEventListener("contextmenu", blockUnlessExempt, options);
  document.addEventListener("copy", blockUnlessExempt, options);
  document.addEventListener("cut", blockUnlessExempt, options);
  document.addEventListener("paste", blockUnlessExempt, options);
  document.addEventListener("selectstart", blockUnlessExempt, options);
  document.addEventListener("dragstart", blockUnlessExempt, options);
  document.addEventListener("keydown", onKeyDown, options);
  document.addEventListener("selectionchange", onSelectionChange);
  window.addEventListener("beforeprint", onBeforePrint);

  if (typeof console !== "undefined") {
    console.log(
      "%cDNS Resolution Simulator",
      "font-weight:bold;font-size:14px;color:#1d4ed8",
      "— Interactive demo by Kaustuv Basak. Source is not licensed for reuse.",
    );
  }

  return () => {
    installed = false;
    document.documentElement.classList.remove(HARDENING_CLASS);
    document.removeEventListener("contextmenu", blockUnlessExempt, options);
    document.removeEventListener("copy", blockUnlessExempt, options);
    document.removeEventListener("cut", blockUnlessExempt, options);
    document.removeEventListener("paste", blockUnlessExempt, options);
    document.removeEventListener("selectstart", blockUnlessExempt, options);
    document.removeEventListener("dragstart", blockUnlessExempt, options);
    document.removeEventListener("keydown", onKeyDown, options);
    document.removeEventListener("selectionchange", onSelectionChange);
    window.removeEventListener("beforeprint", onBeforePrint);
  };
}
