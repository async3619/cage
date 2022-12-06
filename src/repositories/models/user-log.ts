import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from "typeorm";

import { User } from "@repositories/models/user";
import { Nullable } from "@utils/types";

export enum UserLogType {
    Follow = "follow",
    Unfollow = "unfollow",
    RenameDisplayName = "rename-display-name",
    RenameUserId = "rename-user-id",
}

@Entity({ name: "user-logs" })
export class UserLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: "varchar", length: 255 })
    public type!: UserLogType;

    @Column({ type: "varchar", length: 255, nullable: true })
    public oldUserId!: Nullable<string>;

    @Column({ type: "varchar", length: 255, nullable: true })
    public oldDisplayName!: Nullable<string>;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @ManyToOne(() => User, follower => follower.userLogs)
    public user!: User;

    @RelationId((userLog: UserLog) => userLog.user)
    public userLogId!: string;
}
