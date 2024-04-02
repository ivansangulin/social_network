import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

type ValidationResultError = {
  [string: string]: [string];
};
const Validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let error: ValidationResultError = {};
    errors.array().map((err) => (error[err.type] = err.msg));
    return res.status(422).json({ error });
  }
  next();
};
export default Validate;
