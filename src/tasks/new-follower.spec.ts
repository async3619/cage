import { NewFollowerTask } from "@tasks/new-follower";
import { UserLogRepository, UserLogType } from "@repositories/user-log";

describe("NewFollowerTask", () => {
    it("should detect new followers between old and new user items", async function () {
        const mockUserLogRepository = {
            getFollowStatusMap: jest.fn().mockResolvedValue({
                user1: true,
                user2: false,
            }),

            create: jest.fn().mockReturnValue({}),
        } as unknown as UserLogRepository;

        const followers = [{ id: "user1" }, { id: "user2" }];
        const task = new NewFollowerTask([], [], null as any, mockUserLogRepository, NewFollowerTask.name);
        const result = await task.process([{ type: "new-users", data: followers as any }]);

        expect(result).toEqual({
            type: "new-logs",
            data: [
                {
                    type: UserLogType.Follow,
                    user: { id: "user2" },
                },
            ],
        });
    });
});
