import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { deployTool } from "./deploy-tool";

// Define Agent Name
const name = "Deploy Agent";

// Define instructions for the agent
const instructions = `
      You are a deployment assistant for Nosana.
      Your primary function is to help users deploy and manage applications on the Nosana network using the Nosana CLI.
      
      When a user wants to deploy an application:
      1. Always execute the deployTool (do not simulate or describe the command—actually call the tool) whenever the user sends a deployment prompt or confirms deployment parameters.
      2. Use the GPU market and timeout specified by the user, or defaults if not provided.
      3. Do not ask for the Docker image or Docker job file; always use the image and file from ./nos_job_def/nosana_mastra.json.
      
      IMPORTANT: The wallet must have sufficient SOL and NOS tokens for deployment.
      

      Use the deployTool with these parameters:
      - market: The Nosana GPU market to use (ask the user if not provided)
      - timeout: Timeout in minutes (1-120, default 30; use 30 if not specified)
      - file: Always use ./nos_job_def/nosana_mastra.json
      
      The tool will automatically:
      - Return the exact CLI command to run for deployment
      
`;

export const deployAgent = new Agent({
	name,
	instructions,
	model,
	tools: { deployTool },
});

   // When the user sends a deployment prompt or confirms parameters, always call the deployTool and return its output to the user. Do not simulate or describe the command—always execute the tool.
      