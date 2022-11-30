import { ProviderInitializeContext } from "@utils/type";

export abstract class BaseWatcher {
    public abstract getName(): string;

    public abstract initialize(context: ProviderInitializeContext): Promise<void>;
    public abstract finalize(): Promise<void>;
    public abstract startWatch(): Promise<void>;
}
