const API_ACTIVITY_EVENT = "shootatside:api-activity";

function dispatchApiActivity(active: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(API_ACTIVITY_EVENT, { detail: { active } }));
  }
}

export async function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  dispatchApiActivity(true);
  try {
    return await fetch(input, init);
  } finally {
    dispatchApiActivity(false);
  }
}

export function onApiActivity(callback: (active: boolean) => void) {
  const listener = (event: Event) => callback(Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active));
  window.addEventListener(API_ACTIVITY_EVENT, listener);
  return () => window.removeEventListener(API_ACTIVITY_EVENT, listener);
}
