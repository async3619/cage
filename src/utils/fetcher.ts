import nodeFetch, { Headers, Response } from "node-fetch";

import { sleep } from "@utils/sleep";
import { Logger } from "@utils/logger";
import { parseCookie } from "@utils/parseCookie";
import { buildQueryString } from "@utils/buildQueryString";
import { Hydratable, Serializable } from "@utils/types";

interface FetchOption {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    retryCount?: number; // retry count (default: -1, infinite)
    retryDelay?: number; // in ms (default: 1000)
    data?: Record<string, any>;
    headers?: Record<string, string>;
}

export class Fetcher implements Serializable, Hydratable {
    private readonly cookies: Record<string, string> = {};
    private readonly fetchImpl = nodeFetch;
    private readonly logger = new Logger("Fetcher");

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

    public async fetchJson<T>(options: FetchOption): Promise<T> {
        const response = await this.fetch(options);
        return response.json();
    }
    public async fetch({
        url,
        headers,
        data,
        method = "GET",
        retryCount = 0,
        retryDelay = 1000,
    }: FetchOption): Promise<Response> {
        let endpoint = url;
        if (method === "GET" && data) {
            endpoint = `${endpoint}?${buildQueryString(data)}`;
        }

        const fetchHeaders = new Headers({
            cookie: this.getCookieString(),
            ...headers,
        });

        if (method !== "GET" && data) {
            fetchHeaders.set("Content-Type", "application/json");
        }

        try {
            const response = await this.fetchImpl(endpoint, {
                method: method,
                headers: fetchHeaders,
                body: method === "GET" ? undefined : JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`${response.status} (${response.statusText})`);
            }

            this.setCookies(response.headers.get("set-cookie"));

            return response;
        } catch (e) {
            if (retryCount === 0 || !(e instanceof Error)) {
                throw e;
            }

            this.logger.error("failed to fetch {}: {}", [url, e.message]);
            if (retryDelay > 0) {
                this.logger.error("retrying in {}ms ...", [retryDelay]);
            } else {
                this.logger.error("retrying ...");
            }

            await sleep(retryDelay);
            return this.fetch({
                url,
                headers,
                data,
                method,
                retryCount: retryCount - 1,
                retryDelay,
            });
        }
    }

    public serialize(): Record<string, any> {
        return {
            cookies: this.cookies,
        };
    }
    public hydrate(data: Record<string, any>): void {
        Object.keys(data.cookies).forEach(key => {
            this.cookies[key] = data.cookies[key];
        });
    }
}
