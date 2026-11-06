// Writes the compiled ABI + bytecode to frontend/artifact.js for the in-browser deploy page.
// Run after changing the contract: npx hardhat compile && node scripts/export-artifact.js
const fs = require("fs");
const path = require("path");
const a = require("../artifacts/contracts/TradeEscrow.sol/TradeEscrow.json");
fs.writeFileSync(
  path.join(__dirname, "..", "frontend", "artifact.js"),
  "// Generated from the compiled contract. Used by deploy.html.\nwindow.ESCROW_ARTIFACT = " +
    JSON.stringify({ abi: a.abi, bytecode: a.bytecode }) + ";\n"
);
console.log("Wrote frontend/artifact.js");
