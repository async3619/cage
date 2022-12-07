import * as path from "path";
import * as argon2 from "argon2";
import * as fs from "fs-extra";

import { UserData } from "@repositories/models/user";

import { WatcherTypes } from "@watchers";

import { Loggable } from "@utils/types";

export interface BaseWatcherOptions<TType extends WatcherTypes> {
    type: TType;
}

export type PartialUserData = Omit<UserData, "from">;

export abstract class BaseWatcher<TType extends string> extends Loggable<TType> {
    private readonly stateFileDirectory = path.join(process.cwd(), "./dump/");

    protected constructor(name: TType) {
        super(name);
    }

    public abstract initialize(): Promise<void>;

    public async doWatch(): Promise<UserData[]> {
        const followers = await this.getFollowers();

        return followers.map(user => ({
            ...user,
            from: this.getName().toLowerCase(),
        }));
    }

    protected abstract getFollowers(): Promise<PartialUserData[]>;

    public async saveState() {
        await this.logger.work({
            message: "saving state",
            level: "info",
            work: async () => {
                const serializedData = this.serialize();
                const fileName = `${this.getName().toLowerCase()}.json`;
                const filePath = path.join(this.stateFileDirectory, fileName);

                serializedData["__hash__"] = await this.hash();

                await fs.ensureFile(filePath);
                await fs.writeJson(filePath, serializedData, { spaces: 4 });
            },
        });
    }
    public async loadState() {
        await this.logger.work({
            message: "loading state",
            level: "info",
            work: async () => {
                const fileName = `${this.getName().toLowerCase()}.json`;
                const filePath = path.join(this.stateFileDirectory, fileName);

                if (!fs.existsSync(filePath)) {
                    this.logger.warn(`saved state not found. skipping loading state.`);
                    return;
                }

                const serializedData = await fs.readJson(filePath);
                const isOutdated = !(await this.checkHash(serializedData["__hash__"]));
                if (isOutdated) {
                    this.logger.warn(`saved state is outdated. skipping loading state.`);
                    return;
                }

                this.hydrate(serializedData);
            },
        });
    }

    private async hash() {
        const hash = await argon2.hash(JSON.stringify(this.getHashData()));
        return Buffer.from(hash).toString("base64");
    }
    private async checkHash(hash: string) {
        // base64 to string
        hash = Buffer.from(hash, "base64").toString("utf-8");
        return argon2.verify(hash, JSON.stringify(this.getHashData()));
    }

    protected abstract getHashData(): any;

    protected abstract serialize(): Record<string, any>;
    protected abstract hydrate(data: Record<string, any>): void;
}
