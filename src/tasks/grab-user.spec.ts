import { GrabUserTask } from "@tasks/grab-user";
import { BaseWatcher } from "@watchers/base";

describe("GrabUserTask", () => {
    it("should grab users from watchers", async function () {
        const watchers = [
            {
                doWatch: jest.fn().mockResolvedValueOnce([{ id: 1, name: "user1" }]),
            },
            {
                doWatch: jest.fn().mockResolvedValueOnce([{ id: 2, name: "user2" }]),
            },
        ] as any as BaseWatcher<any>[];

        const task = new GrabUserTask(watchers, [], null as any, null as any, GrabUserTask.name);
        const result = await task.process();

        expect(result).toEqual({
            type: "new-users",
            data: [
                { id: 1, name: "user1" },
                { id: 2, name: "user2" },
            ],
        });
        expect(watchers[0].doWatch).toBeCalledTimes(1);
        expect(watchers[1].doWatch).toBeCalledTimes(1);
    });

    it("should terminate if no users found", async function () {
        const watchers = [
            {
                doWatch: jest.fn().mockResolvedValueOnce([]),
            },
            {
                doWatch: jest.fn().mockResolvedValueOnce([]),
            },
        ] as any as BaseWatcher<any>[];

        const task = new GrabUserTask(watchers, [], null as any, null as any, GrabUserTask.name);
        const result = await task.process();

        expect(result).toEqual({
            type: "terminate",
            reason: "No followers found",
        });
        expect(watchers[0].doWatch).toBeCalledTimes(1);
        expect(watchers[1].doWatch).toBeCalledTimes(1);
    });
});
