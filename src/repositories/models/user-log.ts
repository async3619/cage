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

export enum UserLogType {
    Follow = "follow",
    Unfollow = "unfollow",
}

@Entity({ name: "follower-logs" })
export class UserLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: "varchar", length: 255 })
    public type!: UserLogType;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @ManyToOne(() => User, follower => follower.userLogs)
    public user!: User;

    @RelationId((userLog: UserLog) => userLog.user)
    public userLogId!: string;
}
