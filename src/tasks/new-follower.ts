import { BaseTask, TaskData } from "@tasks/base";
import { UserLogType } from "@repositories/models/user-log";

export class NewFollowerTask extends BaseTask {
    public async process(previousData: TaskData[]): Promise<TaskData> {
        const followingMap = await this.userLogRepository.getFollowStatusMap();
        const newUsers = previousData.filter(BaseTask.isNewUsersData).flatMap(item => item.data);
        const newFollowers = newUsers.filter(p => !followingMap[p.id]);

        return {
            type: "new-logs",
            data: newFollowers.map(item => {
                const log = this.userLogRepository.create();
                log.type = UserLogType.Follow;
                log.user = item;

                return log;
            }),
        };
    }
}
