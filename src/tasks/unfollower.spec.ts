import { UserLogRepository, UserLogType } from "@repositories/user-log";
import { UserRepository } from "@repositories/user";

import { UnfollowerTask } from "@tasks/unfollower";

describe("UnfollowerTask", () => {
    it("should detect unfollowers between old and new user items", async () => {
        const mockUserRepository = {
            find: jest.fn().mockResolvedValue([{ id: "user1" }, { id: "user2" }]),
        } as unknown as UserRepository;
        const mockUserLogRepository = {
            getFollowStatusMap: jest.fn().mockResolvedValue({ user1: true, user2: true }),
            create: jest.fn().mockImplementation(item => item || {}),
        } as unknown as UserLogRepository;

        const task = new UnfollowerTask([], [], mockUserRepository, mockUserLogRepository, UnfollowerTask.name);
        const result = await task.process([{ type: "new-users", data: [] }]);

        expect(result).toEqual({
            type: "new-logs",
            data: [
                { type: UserLogType.Unfollow, user: { id: "user1" } },
                { type: UserLogType.Unfollow, user: { id: "user2" } },
            ],
        });
    });
});
