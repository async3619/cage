import * as path from "path";
import * as argon2 from "argon2";
import * as fs from "fs-extra";

import { UserData } from "@repositories/models/user";

import { Loggable } from "@utils/types";

export abstract class BaseWatcher extends Loggable {
    private readonly stateFileDirectory = path.join(process.cwd(), "./dump/");

    protected constructor(name: string, private readonly hashData: any) {
        super(name);
    }

    public abstract initialize(options: Record<string, any>): Promise<void>;

    public abstract doWatch(): Promise<UserData[]>;

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

    protected async hash() {
        const hash = await argon2.hash(JSON.stringify(this.hashData));
        return Buffer.from(hash).toString("base64");
    }
    protected async checkHash(hash: string) {
        // base64 to string
        hash = Buffer.from(hash, "base64").toString("utf-8");
        return argon2.verify(hash, JSON.stringify(this.hashData));
    }

    protected abstract serialize(): Record<string, any>;
    protected abstract hydrate(data: Record<string, any>): void;
}
