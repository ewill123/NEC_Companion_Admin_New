// api/server.js
import express from "express";
import twilio from "twilio";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import serverless from "serverless-http";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ===== Middleware =====
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/token", limiter);

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_TWIML_APP_SID,
} = process.env;

// ===== Health Check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ===== Worker Threads Setup =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_WORKERS = 2; // serverless doesn’t need too many
let workers = [];
for (let i = 0; i < MAX_WORKERS; i++) {
  workers.push(new Worker(path.join(__dirname, "../tokenWorker.js")));
}

let workerIndex = 0;
function getNextWorker() {
  const worker = workers[workerIndex];
  workerIndex = (workerIndex + 1) % MAX_WORKERS;
  return worker;
}

// ===== Token API =====
app.get("/token", async (req, res) => {
  const identity = req.query.identity || "admin";

  try {
    const cachedToken = await redis.get(identity);
    if (cachedToken)
      return res.json({ token: cachedToken, identity, cached: true });

    const worker = getNextWorker();
    worker.once("message", async (jwt) => {
      if (!jwt)
        return res.status(500).json({ error: "Failed to generate token" });

      await redis.set(identity, jwt, "EX", 300);
      res.json({ token: jwt, identity, cached: false });
    });

    worker.postMessage({
      identity,
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY,
      TWILIO_API_SECRET,
      TWILIO_TWIML_APP_SID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ===== Export for Vercel =====
export default serverless(app);
