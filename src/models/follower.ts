import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, RelationId, UpdateDateColumn } from "typeorm";

import { FollowerLog } from "@models/follower-log";

@Entity({ name: "followers" })
export class Follower extends BaseEntity {
    @Column({ type: "varchar", length: 255, primary: true })
    public id!: string;

    @Column({ type: "varchar", length: 255 })
    public from!: string;

    @Column({ type: "varchar", length: 255 })
    public displayName!: string;

    @Column({ type: "boolean" })
    public isFollowing!: boolean;

    @Column({ type: "datetime" })
    public lastlyCheckedAt!: Date;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @OneToMany(() => FollowerLog, followerLog => followerLog.follower, { cascade: true })
    public followerLogs!: FollowerLog[];

    @RelationId((follower: Follower) => follower.followerLogs)
    public followerLogIds!: number[];
}
