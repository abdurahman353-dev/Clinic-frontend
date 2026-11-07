export const DATA_CHANGE_EVENT = "clinic:data-change";

export function notifyDataChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
  }
}

export function onDataChange(handler: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(DATA_CHANGE_EVENT, handler);
  return () => window.removeEventListener(DATA_CHANGE_EVENT, handler);
}
