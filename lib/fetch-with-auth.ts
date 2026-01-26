type FetchOptions = RequestInit & {
  skipAuthCheck?: boolean;
};

export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuthCheck = false, ...fetchOptions } = options;

  const response = await fetch(url, fetchOptions);

  if (!skipAuthCheck && response.status === 401) {
    const data = await response.clone().json().catch(() => ({}));

    if (data.requiresAuth || data.error?.includes("expired") || data.error?.includes("Unauthorized")) {
      window.location.href = "/auth/logout";
      throw new Error("Session expired");
    }
  }

  return response;
}

export async function fetchJSON<T>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await fetchWithAuth(url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.error || "Request failed",
        status: response.status,
      };
    }

    return { data, error: null, status: response.status };
  } catch (error) {
    if (error instanceof Error && error.message === "Session expired") {
      return { data: null, error: "Session expired", status: 401 };
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : "Request failed",
      status: 500,
    };
  }
}
