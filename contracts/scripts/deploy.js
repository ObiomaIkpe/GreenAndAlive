const hre = require("hardhat");

async function main() {
  console.log("Deploying CarbonAI smart contracts...");

  // Deploy CarbonToken first
  const CarbonToken = await hre.ethers.getContractFactory("CarbonToken");
  const carbonToken = await CarbonToken.deploy();
  await carbonToken.waitForDeployment();
  
  const tokenAddress = await carbonToken.getAddress();
  console.log("CarbonToken deployed to:", tokenAddress);

  // Deploy CarbonCredit
  const CarbonCredit = await hre.ethers.getContractFactory("CarbonCredit");
  const carbonCredit = await CarbonCredit.deploy();
  await carbonCredit.waitForDeployment();
  
  const creditAddress = await carbonCredit.getAddress();
  console.log("CarbonCredit deployed to:", creditAddress);

  // Verify contracts on Etherscan (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await carbonToken.deploymentTransaction().wait(6);
    await carbonCredit.deploymentTransaction().wait(6);

    console.log("Verifying contracts...");
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [],
      });
      console.log("CarbonToken verified");
    } catch (error) {
      console.log("CarbonToken verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: creditAddress,
        constructorArguments: [],
      });
      console.log("CarbonCredit verified");
    } catch (error) {
      console.log("CarbonCredit verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    carbonToken: tokenAddress,
    carbonCredit: creditAddress,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\nUpdate your .env file with:");
  console.log(`VITE_CONTRACT_ADDRESS=${creditAddress}`);
  console.log(`VITE_TOKEN_ADDRESS=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });