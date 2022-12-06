import { Repository } from "typeorm";

import { BaseRepository } from "@repositories/base";

import { User } from "@repositories/models/user";
import { UserLog, UserLogType } from "@repositories/models/user-log";

import { mapBy } from "@utils/mapBy";

export class UserLogRepository extends BaseRepository<UserLog> {
    public constructor(repository: Repository<UserLog>) {
        super(repository);
    }

    public async writeLog(user: User, type: UserLog["type"]) {
        const userLog = this.create();
        userLog.user = user;
        userLog.type = type;

        return this.saveItems(userLog);
    }
    public async writeLogs(users: User[], type: UserLog["type"]) {
        const userLogs = users.map(user => {
            const userLog = this.create();
            userLog.user = user;
            userLog.type = type;

            return userLog;
        });

        return this.saveItems(userLogs);
    }
    public async batchWriteLogs(items: [User[], UserLog["type"]][]) {
        const userLogs = items.flatMap(([users, type]) =>
            users.map(user => {
                const userLog = this.create();
                userLog.user = user;
                userLog.type = type;

                return userLog;
            }),
        );

        return this.saveItems(userLogs);
    }

    public async getFollowStatusMap() {
        const data = await this.createQueryBuilder()
            .select("type")
            .addSelect("userId")
            .addSelect("MAX(createdAt)", "createdAt")
            .where("type IN (:...types)", { types: [UserLogType.Follow, UserLogType.Unfollow] })
            .groupBy("userId")
            .getRawMany<{ type: UserLog["type"]; userId: string; createdAt: string }>();

        return mapBy(data, "userId", item => item.type === UserLogType.Follow);
    }
}
