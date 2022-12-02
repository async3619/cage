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

import { Follower } from "@models/follower";

export enum FollowerLogType {
    Follow = "follow",
    Unfollow = "unfollow",
}

@Entity({ name: "follower-logs" })
export class FollowerLog extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: "varchar", length: 255 })
    public type!: FollowerLogType;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @ManyToOne(() => Follower, follower => follower.followerLogs)
    public follower!: Follower;

    @RelationId((followerLog: FollowerLog) => followerLog.follower)
    public followerId!: string;
}
