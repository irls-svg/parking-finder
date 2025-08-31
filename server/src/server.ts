import express from "express";
import { handleIndex } from "./routes";
import { handleSearch } from "./routes/search";
import { ApiError, errorHandler } from "./middleware/middleware";
import { createBucketIfNotExists, createPageCountIfNotExists, handleHits } from "./routes/hit";
import cors from "cors";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

createBucketIfNotExists();
createPageCountIfNotExists();

app.get("/", handleIndex);
app.get("/hit", handleHits);
app.get("/search", handleSearch);

app.use(notFound);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;

function notFound() {
  throw new ApiError("Resource not found", 404);
}
