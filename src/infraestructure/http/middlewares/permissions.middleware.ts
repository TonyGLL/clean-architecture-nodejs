import { NextFunction, Request, Response } from "express";

export const permissionsMiddleware = (req: Request, res: Response, next: NextFunction) => {

    next();
}