export function buildQueryString(queries: Record<string, string | number>) {
    return Object.entries(queries)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}
