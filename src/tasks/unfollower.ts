import { BaseTask, TaskData } from "@tasks/base";
import { mapBy } from "@utils/mapBy";
import { UserLogType } from "@repositories/models/user-log";

export class UnfollowerTask extends BaseTask {
    public async process(previousData: TaskData[]): Promise<TaskData> {
        const followingMap = await this.userLogRepository.getFollowStatusMap();
        const oldUsers = await this.userRepository.find();
        const newUsers = previousData.filter(BaseTask.isNewUsersData).flatMap(item => item.data);
        const newUserMap = mapBy(newUsers, "id");
        const unfollowers = oldUsers.filter(p => !newUserMap[p.id] && followingMap[p.id]);

        return {
            type: "new-logs",
            data: unfollowers.map(item =>
                this.userLogRepository.create({
                    type: UserLogType.Unfollow,
                    user: item,
                }),
            ),
        };
    }
}
