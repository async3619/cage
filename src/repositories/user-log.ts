import { Repository } from "typeorm";

import { BaseRepository } from "@repositories/base";
import { UserLog, UserLogType } from "@repositories/models/user-log";

import { mapBy } from "@utils/mapBy";

export class UserLogRepository extends BaseRepository<UserLog> {
    public constructor(repository: Repository<UserLog>) {
        super(repository);
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

export * from "./models/user-log";
