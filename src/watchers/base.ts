import { Hydratable, Loggable, ProviderInitializeContext, Serializable } from "@utils/type";
import { Follower } from "@root/models/follower";

export abstract class BaseWatcher extends Loggable implements Serializable, Hydratable {
    protected constructor(name: string) {
        super(name);
    }

    public getName(): string {
        return this.name;
    }

    public abstract initialize(context: ProviderInitializeContext): Promise<void>;
    public abstract finalize(): Promise<void>;

    public abstract doWatch(): Promise<Follower[]>;

    public abstract serialize(): Record<string, any>;
    public abstract hydrate(data: Record<string, any>): void;
}
