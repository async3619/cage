export class HttpError extends Error {
    public readonly statusCode: number;
    public readonly statusMessage: string;

    public constructor(statusCode: number, statusMessage: string) {
        super(`HTTP Error ${statusCode}: ${statusMessage}`);

        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
    }
}
