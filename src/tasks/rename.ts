import { BaseTask, TaskData } from "@tasks/base";

import { UserLogType } from "@repositories/models/user-log";
import { User } from "@repositories/models/user";

import { getDiff, isRequired, mapBy } from "@utils";

export class RenameTask extends BaseTask {
    private createGenerator(
        logType: UserLogType.RenameUserId | UserLogType.RenameDisplayName,
        oldUsersMap: Record<string, User>,
    ) {
        return (item: User) => {
            const oldUser = oldUsersMap[item.id];
            return this.userLogRepository.create({
                type: logType,
                user: item,
                oldDisplayName: oldUser.displayName,
                oldUserId: oldUser.userId,
            });
        };
    }

    public async process(previousData: TaskData[]): Promise<TaskData> {
        const oldUsers = await this.userRepository.find();
        const oldUsersMap = mapBy(oldUsers, "id");
        const newUsers = previousData.filter(BaseTask.isNewUsersData).flatMap(item => item.data);

        // find user renaming their displayName or userId
        const displayNameRenamedUsers = getDiff(newUsers, oldUsers, "uniqueId", "displayName");
        const userIdRenamedUsers = getDiff(newUsers, oldUsers, "uniqueId", "userId");

        return {
            type: "new-logs",
            data: [
                ...displayNameRenamedUsers.map(this.createGenerator(UserLogType.RenameDisplayName, oldUsersMap)),
                ...userIdRenamedUsers.map(this.createGenerator(UserLogType.RenameUserId, oldUsersMap)),
            ].filter(isRequired),
        };
    }
}
