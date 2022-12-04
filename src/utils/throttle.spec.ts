import { throttle } from "@utils/throttle";

describe("throttle() Function", function () {
    it("should return the result of the target function", async function () {
        const target = async () => 1;
        const result = await throttle(target, 0);

        expect(result).toBe(1);
    });

    it("should return the result of the target promise", async function () {
        const target = Promise.resolve(1);
        const result = await throttle(target, 0);

        expect(result).toBe(1);
    });

    it("should return the result of the target function with the elapsed time", async function () {
        const target = async () => 1;
        const [result, elapsedTime] = await throttle(target, 1000, true);

        expect(result).toBe(1);
        expect(elapsedTime).toBeGreaterThanOrEqual(1000);
    });

    it("should return the result of the target promise with the elapsed time", async function () {
        const target = Promise.resolve(1);
        const [result, elapsedTime] = await throttle(target, 1000, true);

        expect(result).toBe(1);
        expect(elapsedTime).toBeGreaterThanOrEqual(1000);
    });
});
