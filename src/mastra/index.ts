import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { weatherAgent } from "./agents/weather-agent/weather-agent"; // This can be deleted later
import { weatherWorkflow } from "./agents/weather-agent/weather-workflow"; // This can be deleted later
import { cryptoPriceAgent } from "./agents/your-agent/your-agent"; // Crypto price agent
import { cryptoWorkflow } from "./agents/your-agent/crypto-workflow"; // Crypto workflow
import { deployAgent } from "./agents/deploy-agent/deploy-agent";

export const mastra = new Mastra({
  workflows: { weatherWorkflow, cryptoWorkflow }, // can be deleted later
  agents: { weatherAgent, cryptoPriceAgent, deployAgent },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  server: {
    port: 8080,
    timeout: 10000,
  },
});
