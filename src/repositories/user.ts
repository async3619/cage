import { Repository } from "typeorm";

import { BaseRepository } from "@repositories/base";
import { User } from "@repositories/models/user";

export class UserRepository extends BaseRepository<User> {
    public constructor(repository: Repository<User>) {
        super(repository);
    }
}

export * from "./models/user";
