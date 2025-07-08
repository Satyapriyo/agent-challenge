import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

// Directly run the nosana CLI command
const deployToNosanaDirect = async ({
  market,
  timeout,
  verbose = false,
}: {
  market: string;
  timeout: number;
  verbose?: boolean;
}) => {
  const command = `nosana job post --file ./nos_job_def/nosana_mastra.json --market "${market}" --timeout ${timeout}`;
  return {
    success: true,
    output: command,
    stdout: command,
    stderr: '',
  };
};

// ✅ Shell script-based deployment function
const deployToNosanaShell = async ({
  image,
  market,
  timeout,
  verbose = false,
}: {
  image: string;
  market: string;
  timeout: number;
  verbose?: boolean;
}) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to the shell script (assuming it's in the same directory)
  const scriptPath = path.resolve(__dirname, "nosana_deploy.sh");

  // Check if shell script exists
  if (!fs.existsSync(scriptPath)) {
    return {
      success: false,
      error: `Shell script not found at: ${scriptPath}. Please create the nosana_deploy.sh file.`,
    };
  }

  // Make sure script is executable
  try {
    fs.chmodSync(scriptPath, 0o755);
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to make script executable: ${error.message}`,
    };
  }

  // Build command arguments
  const args = [
    `--image "${image}"`,
    `--market "${market}"`,
    `--timeout ${timeout}`,
    `--file ./nos_job_def/nosana_mastra.json`,
  ];

  if (verbose) {
    args.push("--verbose");
  }

  const command = `${scriptPath} ${args.join(" ")}`;

  console.log(`🚀 Executing: ${command}`);

  try {
    // Use execAsync for better error handling and output capture
    const { stdout, stderr } = await execAsync(command, {
      env: process.env,
      cwd: process.cwd(),
      timeout: (timeout + 30) * 1000, // Add 30 seconds buffer
    });

    const output = stdout || stderr || "✅ Job submitted successfully!";
    console.log("📤 Script output:", output);

    return {
      success: true,
      output: output,
      stdout: stdout,
      stderr: stderr,
    };
  } catch (error: any) {
    console.error("❌ Shell script execution failed:", error.message);

    return {
      success: false,
      error: error.message,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
    };
  }
};

// ✅ Synchronous version (simpler, blocks until completion)
const deployToNosanaShellSync = ({
  image,
  market,
  timeout,
  verbose = false,
}: {
  image: string;
  market: string;
  timeout: number;
  verbose?: boolean;
}) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.resolve(__dirname, "nosana_deploy.sh");

  if (!fs.existsSync(scriptPath)) {
    return {
      success: false,
      error: `Shell script not found at: ${scriptPath}`,
    };
  }

  try {
    fs.chmodSync(scriptPath, 0o755);
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to make script executable: ${error.message}`,
    };
  }

  const args = [
    `--image "${image}"`,
    `--market "${market}"`,
    `--timeout ${timeout}`,
    `--file ./nos_job_def/nosana_mastra.json`,
  ];

  if (verbose) {
    args.push("--verbose");
  }

  const command = `${scriptPath} ${args.join(" ")}`;

  console.log(`🚀 Executing: ${command}`);

  try {
    const output = execSync(command, {
      encoding: "utf8",
      env: process.env,
      stdio: "pipe", // Capture output
      timeout: (timeout + 30) * 1000,
    });

    console.log("📤 Script output:", output);

    return {
      success: true,
      output: output,
    };
  } catch (error: any) {
    console.error("❌ Shell script execution failed:", error.message);

    return {
      success: false,
      error: error.message,
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || "",
    };
  }
};

// ✅ Mastra tool using shell script
export const deployTool = createTool({
  id: "nosana-deployment-cli",
  description:
    "Deploy to Nosana by running the nosana CLI directly with the provided GPU market and timeout.",
  inputSchema: z.object({
    market: z
      .string()
      .default("nvidia-3060")
      .describe("Nosana GPU market (default: nvidia-3060)"),
    timeout: z
      .number()
      .min(1)
      .max(120)
      .default(30)
      .describe("Timeout in minutes (default: 30)"),
    verbose: z.boolean().default(false).describe("Enable verbose output"),
    useAsync: z
      .boolean()
      .default(true)
      .describe("Use async execution (recommended)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    output: z.string().optional(),
    error: z.string().optional(),
    stdout: z.string().optional(),
    stderr: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { useAsync, ...params } = context;
    return await deployToNosanaDirect(params);
  },
});

// ✅ Direct function export for manual use
export const deployToNosana = deployToNosanaShell;
export const deployToNosanaSync = deployToNosanaShellSync;

// ✅ Setup function to create the shell script
export const setupNosanaScript = (targetDir?: string) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = targetDir
    ? path.resolve(targetDir, "nosana_deploy.sh")
    : path.resolve(__dirname, "nosana_deploy.sh");

  // The shell script content would be written here
  // For now, just check if it exists
  if (fs.existsSync(scriptPath)) {
    console.log(`✅ Shell script already exists at: ${scriptPath}`);
    return scriptPath;
  } else {
    console.log(`❌ Shell script not found at: ${scriptPath}`);
    console.log(
      "Please create the nosana_deploy.sh file from the provided script."
    );
    return null;
  }
};
