const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, true); // relax in dev; tighten in production if desired
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Compression + logging
app.use(compression());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Routes
app.get("/", (req, res) => res.json({ success: true, service: "GP Ghirni Tax API", docs: "/api/health" }));
app.use("/api", routes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
