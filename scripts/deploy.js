// Deploys TradeEscrow and writes its address + ABI into frontend/config.js
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`Deploying from ${deployer.address} on chain ${chainId}...`);

  const escrow = await hre.ethers.deployContract("TradeEscrow");
  await escrow.waitForDeployment();
  const address = await escrow.getAddress();
  console.log(`TradeEscrow deployed to ${address}`);

  const artifact = await hre.artifacts.readArtifact("TradeEscrow");
  const config = { address, chainId: Number(chainId), abi: artifact.abi };
  const out = path.join(__dirname, "..", "frontend", "config.js");
  fs.writeFileSync(out, `window.ESCROW_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);

  if (Number(chainId) === 11155111) {
    console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${address}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
