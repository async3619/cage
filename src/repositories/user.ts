import { Repository } from "typeorm";

import { BaseRepository } from "@repositories/base";
import { User, UserData } from "@repositories/models/user";

export class UserRepository extends BaseRepository<User> {
    public constructor(repository: Repository<User>) {
        super(repository);
    }

    public async createFromData(data: UserData | UserData[], lastlyCheckedAt: Date = new Date()) {
        if (!Array.isArray(data)) {
            data = [data];
        }

        const users = data.map(item => {
            const user = this.create();
            user.id = `${item.from}:${item.uniqueId}`;
            user.displayName = item.displayName;
            user.userId = item.userId;
            user.uniqueId = item.uniqueId;
            user.from = item.from;
            user.lastlyCheckedAt = lastlyCheckedAt;

            return user;
        });

        return this.saveItems(users);
    }
}
