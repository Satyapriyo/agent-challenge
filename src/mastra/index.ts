import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";


import { cryptoPriceAgent } from "./agents/your-agent/your-agent"; // Crypto price agent
import { cryptoWorkflow } from "./agents/your-agent/crypto-workflow"; // Crypto workflow


export const mastra = new Mastra({
  workflows: {  cryptoWorkflow }, // can be deleted later
  agents: {  cryptoPriceAgent},
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
