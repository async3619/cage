import { BaseEntity, Repository } from "typeorm";

export abstract class BaseRepository<TEntity extends BaseEntity> extends Repository<TEntity> {
    protected constructor(repository: Repository<TEntity>) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}
