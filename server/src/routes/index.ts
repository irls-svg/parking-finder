import { Request, Response } from "express";
import { wrapper } from "../middleware/middleware";

export const handleIndex = wrapper(async (req: Request, res: Response) => {
  res.status(200).send({ status: "OK" });
});
