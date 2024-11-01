import { DEFAULT_TASKS } from "@tasks/index";

describe("Tasks", () => {
    it("should provide predefined task array", () => {
        expect(DEFAULT_TASKS).toBeDefined();
        expect(DEFAULT_TASKS.length).toBeGreaterThan(0);
    });
});
