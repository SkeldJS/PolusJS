export class NonJsonResponse extends Error {
    constructor(
        public readonly text: string
    ) {
        super("Non-Json response: " + text);
    }
}