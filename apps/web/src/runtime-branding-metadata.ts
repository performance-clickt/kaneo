export function resolveRuntimeBrandingMetadata(root: ParentNode = document) {
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-origin-path]",
  )) {
    const path = element.dataset.originPath;
    if (!path) continue;

    const attribute = element instanceof HTMLLinkElement ? "href" : "content";
    element.setAttribute(attribute, new URL(path, window.location.origin).href);
  }
}

resolveRuntimeBrandingMetadata();
