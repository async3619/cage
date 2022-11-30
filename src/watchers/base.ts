import { Hydratable, ProviderInitializeContext, Serializable } from "@utils/type";

export abstract class BaseWatcher implements Serializable, Hydratable {
    public abstract getName(): string;

    public abstract initialize(context: ProviderInitializeContext): Promise<void>;
    public abstract finalize(): Promise<void>;
    public abstract doWatch(): Promise<void>;

    public abstract serialize(): Record<string, any>;
    public abstract hydrate(data: Record<string, any>): void;
}
