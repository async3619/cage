import { UserRepository } from "@repositories/user";
import { UserLogRepository } from "@repositories/user-log";

import { SaveTask } from "@tasks/save";

describe("SaveTask", () => {
    it("should save new users and user logs", async () => {
        const mockUserRepository = { save: jest.fn() } as unknown as UserRepository;
        const mockUserLogRepository = { save: jest.fn() } as unknown as UserLogRepository;

        const mockUsers = [{ id: "user1" }, { id: "user2" }] as any;
        const mockUserLogs = [{ id: "log1" }, { id: "log2" }] as any;
        const task = new SaveTask([], [], mockUserRepository, mockUserLogRepository, SaveTask.name);

        const result = await task.process([
            { type: "new-users", data: mockUsers },
            { type: "new-logs", data: mockUserLogs },
        ]);

        expect(result).toEqual({ type: "save", savedCount: 4 });
        expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
        expect(mockUserRepository.save).toHaveBeenCalledWith(mockUsers);
        expect(mockUserLogRepository.save).toHaveBeenCalledTimes(1);
        expect(mockUserLogRepository.save).toHaveBeenCalledWith(mockUserLogs);
    });

    it("should skip saving if there is no new users and user logs", async () => {
        const mockUserRepository = { save: jest.fn() } as unknown as UserRepository;
        const mockUserLogRepository = { save: jest.fn() } as unknown as UserLogRepository;

        const task = new SaveTask([], [], mockUserRepository, mockUserLogRepository, SaveTask.name);
        const result = await task.process([]);

        expect(result).toEqual({ type: "skip", reason: "No new logs or users to save was found" });
        expect(mockUserRepository.save).not.toHaveBeenCalled();
        expect(mockUserLogRepository.save).not.toHaveBeenCalled();
    });
});
