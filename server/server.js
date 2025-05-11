import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./library/db.js";
import userRouter from "./routes/userRoute.js";

// Create Express app and HTPP server
const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);

// Connet to DB
await connectDB();

const PORT = process.env.PORT;
server.listen(PORT, () => console.log("Server is running on PORT:", PORT));
