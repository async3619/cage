import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, RelationId, UpdateDateColumn } from "typeorm";

import { UserLog } from "@root/repositories/models/user-log";

export type UserData = Pick<User, "uniqueId" | "userId" | "from" | "displayName">;

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

    @CreateDateColumn()
    public createdAt!: Date;

    @UpdateDateColumn()
    public updatedAt!: Date;

    @OneToMany(() => UserLog, followerLog => followerLog.user, { cascade: true })
    public userLogs!: UserLog[];

    @RelationId((follower: User) => follower.userLogs)
    public userLogIds!: number[];
}
