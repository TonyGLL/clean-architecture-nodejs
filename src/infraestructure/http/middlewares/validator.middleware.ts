import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCode } from "../../../domain/shared/http.status";

export const expressValidatorErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    res.status(HttpStatusCode.CONFLICT).json({ errors: errors.array() });
}