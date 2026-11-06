# Video script (about 4 minutes)

Alchemy asks for a video of 5 minutes or less: elevator pitch (problem and solution), then a working demo. Say it in your own words; these are talking points, not lines to read.

Before recording:
- Contract deployed on Sepolia, and the web app open at your GitHub Pages link.
- Three wallet accounts named **Buyer**, **Exporter** and **Inspector**, each with a little Sepolia ETH.
- Etherscan open in a second tab on the contract address.

---

## 1. Who you are (15 s)
- Your name, and that you run Arki Solutions and work in agricultural exports from Ethiopia.

## 2. The problem (45 s)
- An exporter sells chickpeas or coffee to a buyer abroad.
- If the buyer pays first, they risk not getting the goods, or getting the wrong quality.
- If the exporter ships first, they risk not getting paid.
- The usual fix, a bank Letter of Credit, is slow, expensive and hard for small exporters to get.

## 3. The solution (45 s)
- TradeEscrow: a smart contract holds the payment.
- Show the 4-step strip on the page: buyer deposits, exporter ships, inspector approves, exporter is paid.
- If the inspector rejects, or the deadline passes, the buyer gets the money back.
- No bank needed, and every step is public on the blockchain.

## 4. Demo (2 min)
1. **Buyer account:** fill in "20 t Dark Kabuli chickpeas", the exporter and inspector addresses, 0.01 ETH, 30 days. Click *Lock payment*, confirm in the wallet, and show the deal appear as **Funded**.
2. **Switch to Exporter:** click *Mark shipped*, enter a container/bill-of-lading number. Status becomes **Shipped**.
3. **Switch to Inspector:** point out the Approve and Reject buttons. Click *Approve & release payment*. Status becomes **Released**.
4. **Etherscan:** show the transactions and the `Released` event, and that the exporter's balance went up.

## 5. Under the hood (20 s)
- Solidity contract with three roles and four states.
- 23 unit tests, run automatically on GitHub (show the green Tests badge or the test output).
- Front-end with ethers.js, hosted on GitHub Pages.

## 6. What's next (15 s)
- Pay in a stablecoin like USDC, partial payments per shipment milestone, and attach inspection certificates via IPFS.
- Thank you.
