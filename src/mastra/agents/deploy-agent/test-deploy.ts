import { deployTool } from "./deploy-tool";

async function testDeploy() {
  const result = await deployTool.execute({
    context: {
      market: "nvidia-3060",
      timeout: 30,
      verbose: true,
      useAsync: true,
    },
    runtimeContext: {},
  });
  console.log("Deployment result:", result);
}

testDeploy(); 