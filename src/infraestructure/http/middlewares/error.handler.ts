import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { HttpError } from "@domain/errors/http.error";

export const errorHandler: ErrorRequestHandler = (err: Error, _: Request, res: Response, __: NextFunction): any => {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Server error' });
}