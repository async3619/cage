import { NotifyTask } from "@tasks/notify";
import { BaseNotifier } from "@notifiers/base";
import { UserLogType } from "@repositories/models/user-log";

describe("NotifyTask", () => {
    it("should notify new logs through notifiers", async () => {
        const mockNotifier = { notify: jest.fn() } as unknown as BaseNotifier<any>;
        const mockUserLogs = [
            { type: UserLogType.Follow } as any,
            { type: UserLogType.Unfollow } as any,
            { type: UserLogType.RenameUserId } as any,
            { type: UserLogType.RenameDisplayName } as any,
        ];

        const task = new NotifyTask([], [mockNotifier], null as any, null as any, NotifyTask.name);
        const result = await task.process([
            {
                type: "new-logs",
                data: mockUserLogs,
            },
        ]);

        expect(result).toEqual({ type: "notify" });
        expect(mockNotifier.notify).toHaveBeenCalledTimes(1);
        expect(mockNotifier.notify).toHaveBeenCalledWith(mockUserLogs, {
            [UserLogType.Follow]: [mockUserLogs[0]],
            [UserLogType.Unfollow]: [mockUserLogs[1]],
            [UserLogType.RenameUserId]: [mockUserLogs[2]],
            [UserLogType.RenameDisplayName]: [mockUserLogs[3]],
            [UserLogType.Rename]: [mockUserLogs[3], mockUserLogs[2]],
        });
    });

    it("should skip notifying if there is no new logs", async () => {
        const mockNotifier = { notify: jest.fn() } as unknown as BaseNotifier<any>;

        const task = new NotifyTask([], [mockNotifier], null as any, null as any, NotifyTask.name);
        const result = await task.process([]);

        expect(result).toEqual({ type: "skip", reason: "No new logs to notify was found" });
        expect(mockNotifier.notify).not.toHaveBeenCalled();
    });
});
