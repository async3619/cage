import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, RelationId, UpdateDateColumn } from "typeorm";

import { UserLog } from "@root/repositories/models/user-log";

@Entity({ name: "users" })
export class User extends BaseEntity {
    @Column({ type: "varchar", length: 255, primary: true })
    public id!: string;

    @Column({ type: "varchar", length: 255 })
    public from!: string;

    @Column({ type: "varchar", length: 255 })
    public uniqueId!: string;

    @Column({ type: "varchar", length: 255 })
    public userId!: string;

    @Column({ type: "varchar", length: 255 })
    public displayName!: string;

    @Column({ type: "datetime" })
    public lastlyCheckedAt!: Date;

    @Column({ type: "varchar" })
    public profileUrl!: string;

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @OneToMany(() => UserLog, followerLog => followerLog.user, { cascade: true })
    public userLogs!: UserLog[];

    @RelationId((follower: User) => follower.userLogs)
    public userLogIds!: number[];
}
