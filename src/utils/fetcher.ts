import fetch, { Headers, RequestInit, Response } from "node-fetch";

import { parseCookie } from "@utils/parseCookie";

export class Fetcher {
    private readonly cookies: Record<string, string> = {};

    private getCookieString(): string {
        return Object.entries(this.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ");
    }
    private setCookies(setCookie: string | null) {
        if (!setCookie) {
            return;
        }

        const cookies = parseCookie(setCookie);
        for (const cookie of cookies) {
            if (cookie.name && cookie.value) {
                this.cookies[cookie.name] = cookie.value;
            }
        }
    }
    public getCookies(): Record<string, string> {
        return { ...this.cookies };
    }

    public async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
        const response = await this.fetch(url, options);
        return response.json();
    }
    public async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        const headers = new Headers(options.headers);
        headers.set("cookie", this.getCookieString());

        const response = await fetch(url, {
            ...options,
            headers,
        });

        this.setCookies(response.headers.get("set-cookie"));
        return response;
    }
}
