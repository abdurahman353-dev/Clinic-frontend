export const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Prevent infinite loops on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }

  const data = response.status !== 204 ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || "An error occurred");
  }

  return data;
}
