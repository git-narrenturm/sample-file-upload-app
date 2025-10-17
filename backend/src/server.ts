import "reflect-metadata";
import "tsconfig-paths/register";

import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import { initializeDatabase } from "@root/ormconfig";

import authRoute from "./routes/authRoute.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

await initializeDatabase();
authRoute(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
