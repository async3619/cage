import stripAnsi from "strip-ansi";

import { BaseTask, TaskData } from "@tasks/base";
import { UserLog } from "@repositories/models/user-log";
import { WorkOptions } from "@utils";

describe("BaseTask", () => {
    it("should determine given task data type", function () {
        const data: TaskData[] = [
            { type: "new-users", data: [] },
            { type: "new-logs", data: [] },
            { type: "notify" },
            { type: "save", savedCount: 0 },
            { type: "terminate", reason: "" },
            { type: "skip", reason: "" },
        ];

        expect(data.map(BaseTask.isNewUsersData)).toEqual([true, false, false, false, false, false]);
        expect(data.map(BaseTask.isNewLogsData)).toEqual([false, true, false, false, false, false]);
        expect(data.map(BaseTask.isTerminateData)).toEqual([false, false, false, false, true, false]);
        expect(data.map(BaseTask.isSkipData)).toEqual([false, false, false, false, false, true]);
    });

    it("should process task with rich logging", async () => {
        const taskDataArray: [TaskData, string][] = [
            [{ type: "new-logs", data: [{} as UserLog] }, "Created 1 new logs"],
            [{ type: "skip", reason: "mock-reason" }, "Skipping `Mock` task: mock-reason"],
            [{ type: "terminate", reason: "mock-reason" }, "Terminating whole task pipeline: mock-reason"],
        ];

        for (const [item, targetMessage] of taskDataArray) {
            class MockTask extends BaseTask {
                public async process(): Promise<TaskData> {
                    return item;
                }
            }

            const task = new MockTask([], [], null as any, null as any, "MockTask");
            let logMessage = "";
            Object.defineProperty(task, "logger", {
                value: {
                    work: jest.fn().mockImplementation((options: WorkOptions<any>) => options.work()),
                    info: jest.fn().mockImplementation((message: string) => (logMessage = message)),
                },
            });

            await task.doWork([]);
            expect(task["logger"].info).toBeCalledTimes(1);
            expect(stripAnsi(logMessage)).toBe(targetMessage);
        }
    });
});
