import { BaseEntity, Repository } from "typeorm";

import { AsyncFn } from "@utils/types";

export abstract class BaseRepository<TEntity extends BaseEntity> extends Repository<TEntity> {
    private readonly buffer: TEntity[] = [];
    private inTransaction = false;

    protected constructor(repository: Repository<TEntity>) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

    public async transaction(task: AsyncFn) {
        this.inTransaction = true;

        try {
            await task();
        } catch (error) {
            await this.closeTransaction();
            throw error;
        }

        await this.closeTransaction();
    }

    private async closeTransaction() {
        if (this.buffer.length === 0) {
            return;
        }

        const items = [...this.buffer];
        this.buffer.length = 0;
        this.inTransaction = false;

        await this.save(items);
    }

    protected async saveItems(item: TEntity): Promise<TEntity>;
    protected async saveItems(items: TEntity[]): Promise<TEntity[]>;
    protected async saveItems(items: TEntity[] | TEntity): Promise<TEntity | TEntity[]> {
        if (this.inTransaction) {
            this.buffer.push(...(Array.isArray(items) ? items : [items]));
            return items;
        }

        if (!Array.isArray(items)) {
            const [result] = await this.save([items]);
            return result;
        }

        return this.save(items);
    }
}
