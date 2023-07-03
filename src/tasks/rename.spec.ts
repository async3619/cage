import { BaseEntity } from "typeorm";
import { User, UserRepository } from "@root/repositories/user";
import { RenameTask } from "@tasks/rename";
import { UserLogRepository, UserLogType } from "@repositories/user-log";

let mockUserId = 0;
function createMockUser(userId: string, displayName: string): Omit<User, keyof BaseEntity> {
    const id = `user${++mockUserId}`;

    return {
        id,
        from: "mock",
        uniqueId: id,
        userId,
        displayName,
        lastlyCheckedAt: new Date(),
        profileUrl: "https://example.com/user1",
        createdAt: new Date(),
        updatedAt: new Date(),
        userLogs: [],
    };
}

describe("RenameTask", () => {
    it("should detect renamed users between old and new user items", async () => {
        const mockNewUsers: Omit<User, keyof BaseEntity>[] = [
            createMockUser("mock1", "mock1"),
            createMockUser("mock2", "mock2"),
        ];
        const mockOldUsers: Omit<User, keyof BaseEntity>[] = [
            { ...mockNewUsers[0], displayName: "old1" },
            { ...mockNewUsers[1], userId: "old2" },
        ];

        const task = new RenameTask(
            [],
            [],
            { find: jest.fn().mockResolvedValue(mockOldUsers) } as unknown as UserRepository,
            { create: jest.fn().mockImplementation(item => item || {}) } as unknown as UserLogRepository,
            RenameTask.name,
        );
        const result = await task.process([{ type: "new-users", data: mockNewUsers as unknown as User[] }]);

        expect(result).toMatchObject({
            type: "new-logs",
            data: [
                {
                    type: UserLogType.RenameDisplayName,
                    user: { id: mockNewUsers[0].id, displayName: "mock1" },
                    oldDisplayName: "old1",
                },
                {
                    type: UserLogType.RenameUserId,
                    user: { id: mockNewUsers[1].id, userId: "mock2" },
                    oldUserId: "old2",
                },
            ],
        });
    });

    it("should not detect renamed users on new user items", async () => {
        const mockNewUsers: Omit<User, keyof BaseEntity>[] = [createMockUser("mock1", "mock1")];
        const task = new RenameTask(
            [],
            [],
            { find: jest.fn().mockResolvedValue(mockNewUsers) } as unknown as UserRepository,
            { create: jest.fn().mockImplementation(item => item || {}) } as unknown as UserLogRepository,
            RenameTask.name,
        );
        const result = await task.process([{ type: "new-users", data: [] }]);

        expect(result).toMatchObject({
            type: "new-logs",
            data: [],
        });
    });
});
