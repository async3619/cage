import { BaseTask, TaskData } from "@tasks/base";

export class SaveTask extends BaseTask {
    public async process(previousData: TaskData[]): Promise<TaskData> {
        const newLogs = previousData.filter(BaseTask.isNewLogsData).flatMap(item => item.data);
        const newUsers = previousData.filter(BaseTask.isNewUsersData).flatMap(item => item.data);
        if (newLogs.length <= 0 && newUsers.length <= 0) {
            return this.skip("No new logs or users to save was found");
        }

        await this.userRepository.save(newUsers);
        await this.userLogRepository.save(newLogs);

        return {
            type: "save",
            savedCount: newLogs.length + newUsers.length,
        };
    }
}
