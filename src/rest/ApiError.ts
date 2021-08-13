export class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly jsonMessage?: string
    ) {
        super("PGG Api Error: " + statusCode + " (" + jsonMessage + ")");
    }
}