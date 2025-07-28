// utils/dom.ts
/**
 * Removes focus from the currently active element, if it's an HTMLElement.
 */
export function blurActiveElement() {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
}
