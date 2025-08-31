import { AxiosError, isAxiosError } from "axios";
import { NextFunction, Request, Response } from "express";

export function wrapper(wrapperFunction: Function) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      return await Promise.resolve(wrapperFunction(req, res, next));
    } catch (error) {
      next(error);
    }
  };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status?: number) {
    super(message);
    this.message = message;
    this.status = status || 500;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function errorHandler(
  error: ApiError | AxiosError | Error,
  request: Request,
  response: Response,
  next: NextFunction
) {
  const printStack = error.stack != undefined; // AxiosError stack is possibly undefined

  if (isAxiosError(error)) {
    const status = error.response?.status || 500;
    console.error(`${status}: ${error.message}`);
    response.status(status).send({ error: { message: error.message, status: status } });
  } else if (error instanceof ApiError) {
    console.error(`${error.status}: ${error.message}`);
    response.status(error.status).send({ error: { message: error.message, status: error.status } });
  } else {
    console.error("500:", error.message || "Unknown");
    response.status(500).send({ error: { message: error.message || "Unknown", status: 500 } });
  }

  if (printStack) console.error(error.stack);
}
