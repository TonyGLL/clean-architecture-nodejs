// Request.user is populated by the auth middlewares with the decoded JWT payload.
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export {};
