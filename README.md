# TradeEscrow

[![Tests](https://github.com/oumburs9/trade-escrow/actions/workflows/test.yml/badge.svg)](https://github.com/oumburs9/trade-escrow/actions/workflows/test.yml)

**Trustless payments for agricultural exports, on Ethereum.**

**Live app:** https://oumburs9.github.io/trade-escrow/ (Sepolia testnet)

**Contract:** [`0xf34A750283881792Fff8BF85C3F0C13C996aA266`](https://sepolia.etherscan.io/address/0xf34A750283881792Fff8BF85C3F0C13C996aA266) on Sepolia

## The problem

When an Ethiopian exporter sells coffee, chickpeas or sesame to a buyer abroad, neither side fully trusts the other:

- If the **buyer pays first**, they risk never receiving the goods, or receiving goods below the agreed quality.
- If the **exporter ships first**, they risk never being paid.

The traditional fix is a bank **Letter of Credit**. It is slow, paperwork-heavy, costs a percentage of the deal in fees, and is hard for small exporters to obtain.

## The solution

TradeEscrow is a smart contract that holds the buyer's payment until a neutral **inspector** (a freight agent, quality-inspection company or trusted third party) confirms that the shipment arrived as agreed.

```
 Buyer ──deposit──▶ [ TradeEscrow contract ] ──release──▶ Exporter
                          ▲
             Inspector approves or rejects
```

1. **Buyer** creates a deal (exporter, inspector, product, deadline) and locks the payment in the contract.
2. **Exporter** ships the goods and marks the deal *Shipped*, with a bill-of-lading or container reference.
3. **Inspector** checks the delivery:
   - **Approve**: the payment goes to the exporter automatically.
   - **Reject**: the payment goes back to the buyer.
4. **Deadline protection:** if nothing is approved by the deadline, the buyer can reclaim the funds.

Every step is recorded on-chain as an event, so all three parties can see the status of the deal at any time. No bank, no paperwork, no trust needed between buyer and seller.

## Project structure

| Path | What it is |
| --- | --- |
| `contracts/TradeEscrow.sol` | The smart contract |
| `test/TradeEscrow.test.js` | 23 unit tests covering every rule and permission |
| `scripts/deploy.js` | Deploys the contract and writes its address + ABI to the front-end |
| `frontend/` | Web app: connect wallet, create deals, act on deals by role |

## Run it

Requirements: Node.js 18+ and a browser wallet (MetaMask, Rabby, etc.).

```bash
npm install
npm test              # runs all 23 tests
```

### Deploy to Sepolia testnet

1. Get a free Sepolia RPC URL from [Alchemy](https://www.alchemy.com/).
2. Get free Sepolia test ETH from a faucet (for example the [Alchemy Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia)).
3. Copy `.env.example` to `.env` and fill in your RPC URL and the private key of a **test-only** wallet.
4. Deploy:

```bash
npm run deploy:sepolia
```

The script prints the contract address and Etherscan link, and updates `frontend/config.js`.

### Run the web app

```bash
npm run frontend
```

Open the URL it prints. Connect your wallet on Sepolia, then:

- From the **buyer** account: fill in the form and lock a payment.
- Switch to the **exporter** account: click *Mark shipped*.
- Switch to the **inspector** account: click *Approve & release payment*, and watch the exporter's balance increase.

You need three accounts in your wallet (buyer, exporter, inspector), each with a little Sepolia ETH for gas.

### Run fully locally (no testnet)

```bash
npm run node            # terminal 1: local blockchain with 20 funded accounts
npm run deploy:local    # terminal 2
npm run frontend        # terminal 3
```

Add the network `http://127.0.0.1:8545` (chain id 31337) to your wallet and import a few of the test private keys printed by `npm run node`. The deploy script sets the right chain id in `frontend/config.js` for you.

## Security notes

- Funds can only move in three ways: inspector approves (to exporter), inspector rejects (to buyer), or the deadline passes (buyer reclaims).
- State is updated **before** any ETH is sent, which prevents re-entrancy and double payouts.
- Buyer, exporter and inspector must be three different addresses.
- Each deal's funds are tracked separately, so one deal can never pay out another deal's money.

## Ideas for the future

- Pay in a stablecoin (USDC) instead of ETH, so prices don't move during shipping.
- Partial releases (for example 30% on shipment, 70% on arrival).
- A multi-signature inspector panel instead of a single inspector.
- Attach inspection certificates and bills of lading via IPFS.

---

Built by Jabir Esmael Oumer as the final project for the Alchemy University Ethereum Developer Bootcamp.
