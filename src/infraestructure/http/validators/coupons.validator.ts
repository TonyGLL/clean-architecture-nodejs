import { query } from "express-validator";
import { pageLimitQueryValidator } from "./general.validator";

export const GetCouponsValidator = [
    ...pageLimitQueryValidator,
    query('search').optional().isString().withMessage('Search must be a string')
]