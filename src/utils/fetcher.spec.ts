import { Headers, HeadersInit, RequestInit } from "node-fetch";

import { Fetcher } from "@utils/fetcher";
import { throttle } from "@utils/throttle";

describe("Fetcher class", function () {
    let target: Fetcher;

    beforeEach(() => {
        target = new Fetcher();

        Object.defineProperty(target, "logger", {
            value: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
                verbose: jest.fn(),
            },
        });
    });

    it("should provide a method to fetch data", async () => {
        const res = await target.fetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
        });

        expect(target.fetch).toBeDefined();
        await expect(res.json()).resolves.toMatchObject({
            userId: 1,
            id: 1,
            title: "delectus aut autem",
            completed: false,
        });
    });

    it("should provide a method to fetch json", async () => {
        const res = await target.fetchJson({
            url: "https://jsonplaceholder.typicode.com/todos/1",
        });

        expect(target.fetchJson).toBeDefined();
        expect(res).toMatchObject({
            userId: 1,
            id: 1,
            title: "delectus aut autem",
            completed: false,
        });
    });

    it("should add query params to the url if method is GET and data provided", async () => {
        let calledUrl = "";
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation((url: string) => {
                calledUrl = url;

                return Promise.resolve({
                    headers: {
                        get: () => "",
                    },
                    ok: true,
                    json: () => {
                        return Promise.resolve({ url });
                    },
                });
            }),
        });

        await target.fetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "GET",
            data: {
                test: "test",
            },
        });

        expect(calledUrl).toBe("https://jsonplaceholder.typicode.com/todos/1?test=test");
    });

    it("should add body as json if method is not GET and data provided", async () => {
        let calledBody: any = "";
        let calledHeader: HeadersInit | undefined;
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation((url: string, options: RequestInit) => {
                calledBody = options.body;
                calledHeader = options.headers;

                return Promise.resolve({
                    headers: {
                        get: () => "",
                    },
                    ok: true,
                    json: () => {
                        return Promise.resolve({ url });
                    },
                });
            }),
        });

        await target.fetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "POST",
            data: {
                test: "test",
            },
        });

        expect(calledHeader).toBeDefined();
        if (calledHeader && calledHeader instanceof Headers) {
            expect(calledHeader.get("Content-Type")).toBe("application/json");
        }

        expect(calledBody).toBe('{"test":"test"}');
    });

    it("should add cookies to the request if cookies are set", async () => {
        let calledHeader: HeadersInit | undefined;
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation((url: string, options: RequestInit) => {
                calledHeader = options.headers;

                return Promise.resolve({
                    headers: {
                        get: () => "",
                    },
                    ok: true,
                    json: () => {
                        return Promise.resolve({ url });
                    },
                });
            }),
        });

        target.hydrate({
            cookies: {
                test: "test",
            },
        });

        await target.fetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "POST",
            data: {
                test: "test",
            },
        });

        expect(calledHeader).toBeDefined();
        if (calledHeader && calledHeader instanceof Headers) {
            expect(calledHeader.get("cookie")).toBe("test=test");
        }
    });

    it("should retry the request if it fails when retryCount is set", async () => {
        let calledCount = 0;
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation(() => {
                calledCount++;

                return Promise.resolve({
                    headers: { get: () => "" },
                    ok: false,
                    status: 500,
                    statusText: "Internal Server Error",
                });
            }),
        });

        await expect(target.fetch({ url: "", retryCount: 3, retryDelay: 0 })).rejects.toThrow(
            "500 (Internal Server Error)",
        );
        expect(calledCount).toBe(4);
    });

    it("should retry with delay the request if it fails when retryCount & retryDealy is set", async () => {
        let calledCount = 0;
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation(() => {
                calledCount++;

                return Promise.resolve({
                    headers: { get: () => "" },
                    ok: false,
                    status: 500,
                    statusText: "Internal Server Error",
                });
            }),
        });

        const [, elapsedTime] = await throttle(
            expect(target.fetch({ url: "", retryCount: 3, retryDelay: 500 })).rejects.toThrow(
                "500 (Internal Server Error)",
            ),
            0,
            true,
        );

        expect(calledCount).toBe(4);
        expect(elapsedTime).toBeGreaterThanOrEqual(1500);
    });

    it("should store cookies in the cookie jar if set-cookie header is present", async () => {
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation(() => {
                return Promise.resolve({
                    headers: {
                        get: (key: string) => {
                            if (key === "set-cookie") {
                                return "test=test";
                            }

                            return "";
                        },
                    },
                    ok: true,
                    json: () => {
                        return Promise.resolve({ url: "" });
                    },
                });
            }),
        });

        await target.fetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "POST",
            data: {
                test: "test",
            },
        });

        expect(target.serialize().cookies).toMatchObject({ test: "test" });
    });

    it("should able to get the cookies from the cookie jar", async () => {
        Object.defineProperty(target, "fetchImpl", {
            value: jest.fn().mockImplementation(() => {
                return Promise.resolve({
                    headers: {
                        get: (key: string) => {
                            if (key === "set-cookie") {
                                return "test=test";
                            }

                            return "";
                        },
                    },
                    ok: true,
                    json: () => {
                        return Promise.resolve({ url: "" });
                    },
                });
            }),
        });

        await target.fetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
            method: "POST",
            data: {
                test: "test",
            },
        });

        expect(target.getCookies()).toMatchObject({ test: "test" });
    });
});
