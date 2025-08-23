// server.js
import express from "express";
import twilio from "twilio";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import helmet from "helmet";
import morgan from "morgan";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ===== Express App =====
const app = express();

// ===== Security & Logging =====
app.use(helmet()); // Protects against common attacks
app.use(cors()); // Allow cross-origin requests
app.use(express.json());
app.use(morgan("dev")); // Logs all requests

// ===== Rate Limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP per 15 min
  message: { error: "Too many requests, please try again later." },
});
app.use("/token", limiter);

// ===== Redis Client =====
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// ===== Twilio Setup =====
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_TWIML_APP_SID,
} = process.env;

// ===== Health Check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", pid: process.pid });
});

// ===== Worker Threads Setup =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_WORKERS = 8;
const workers = [];
for (let i = 0; i < MAX_WORKERS; i++) {
  workers.push(new Worker(path.join(__dirname, "tokenWorker.js")));
}

let workerIndex = 0;
function getNextWorker() {
  const worker = workers[workerIndex];
  workerIndex = (workerIndex + 1) % MAX_WORKERS;
  return worker;
}

// ===== Generate Twilio Token Route =====
app.get("/token", async (req, res) => {
  const identity = req.query.identity || "admin";

  try {
    // ===== Redis Cache Check =====
    const cachedToken = await redis.get(identity);
    if (cachedToken) {
      return res.json({ token: cachedToken, identity, cached: true });
    }

    // ===== Send Request to Worker Thread =====
    const worker = getNextWorker();
    worker.once("message", async (jwt) => {
      if (!jwt) {
        return res.status(500).json({ error: "Failed to generate token" });
      }

      await redis.set(identity, jwt, "EX", 300); // Cache token for 5 minutes
      res.json({ token: jwt, identity, cached: false });
    });

    worker.postMessage({
      identity,
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY,
      TWILIO_API_SECRET,
      TWILIO_TWIML_APP_SID,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
