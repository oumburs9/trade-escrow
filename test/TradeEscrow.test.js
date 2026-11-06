const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TradeEscrow", function () {
  let escrow, buyer, exporter, inspector, stranger;
  const amount = ethers.parseEther("1");
  const product = "20 t Dark Kabuli chickpeas, 8mm";

  async function deadlineIn(days) {
    return (await time.latest()) + days * 24 * 60 * 60;
  }

  async function openDeal() {
    const deadline = await deadlineIn(30);
    await escrow.connect(buyer).createDeal(exporter.address, inspector.address, deadline, product, { value: amount });
    return { id: 0, deadline };
  }

  beforeEach(async function () {
    [buyer, exporter, inspector, stranger] = await ethers.getSigners();
    escrow = await ethers.deployContract("TradeEscrow");
  });

  describe("createDeal", function () {
    it("stores the deal and holds the payment", async function () {
      const { deadline } = await openDeal();
      const d = await escrow.getDeal(0);
      expect(d.buyer).to.equal(buyer.address);
      expect(d.exporter).to.equal(exporter.address);
      expect(d.inspector).to.equal(inspector.address);
      expect(d.amount).to.equal(amount);
      expect(d.deadline).to.equal(deadline);
      expect(d.status).to.equal(0); // Funded
      expect(d.product).to.equal(product);
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(amount);
      expect(await escrow.dealCount()).to.equal(1);
    });

    it("emits DealCreated", async function () {
      const deadline = await deadlineIn(30);
      await expect(
        escrow.connect(buyer).createDeal(exporter.address, inspector.address, deadline, product, { value: amount })
      ).to.emit(escrow, "DealCreated").withArgs(0, buyer.address, exporter.address, inspector.address, amount, deadline, product);
    });

    it("rejects a deal with no payment", async function () {
      const deadline = await deadlineIn(30);
      await expect(
        escrow.connect(buyer).createDeal(exporter.address, inspector.address, deadline, product)
      ).to.be.revertedWithCustomError(escrow, "NoPayment");
    });

    it("rejects a deadline in the past", async function () {
      const past = (await time.latest()) - 1;
      await expect(
        escrow.connect(buyer).createDeal(exporter.address, inspector.address, past, product, { value: amount })
      ).to.be.revertedWithCustomError(escrow, "DeadlineInPast");
    });

    it("rejects overlapping roles", async function () {
      const deadline = await deadlineIn(30);
      await expect(
        escrow.connect(buyer).createDeal(buyer.address, inspector.address, deadline, product, { value: amount })
      ).to.be.revertedWithCustomError(escrow, "InvalidParty");
      await expect(
        escrow.connect(buyer).createDeal(exporter.address, exporter.address, deadline, product, { value: amount })
      ).to.be.revertedWithCustomError(escrow, "InvalidParty");
      await expect(
        escrow.connect(buyer).createDeal(ethers.ZeroAddress, inspector.address, deadline, product, { value: amount })
      ).to.be.revertedWithCustomError(escrow, "InvalidParty");
    });
  });

  describe("markShipped", function () {
    it("lets the exporter mark the deal shipped", async function () {
      await openDeal();
      await expect(escrow.connect(exporter).markShipped(0, "BL-ETH-2026-0042"))
        .to.emit(escrow, "Shipped").withArgs(0, "BL-ETH-2026-0042");
      expect((await escrow.getDeal(0)).status).to.equal(1); // Shipped
    });

    it("blocks anyone else", async function () {
      await openDeal();
      await expect(escrow.connect(stranger).markShipped(0, "x")).to.be.revertedWithCustomError(escrow, "NotExporter");
      await expect(escrow.connect(buyer).markShipped(0, "x")).to.be.revertedWithCustomError(escrow, "NotExporter");
    });

    it("cannot be marked shipped twice", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await expect(escrow.connect(exporter).markShipped(0, "x")).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("approve", function () {
    it("pays the exporter when the inspector approves", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await expect(escrow.connect(inspector).approve(0))
        .to.changeEtherBalances([exporter, escrow], [amount, -amount]);
      expect((await escrow.getDeal(0)).status).to.equal(2); // Released
    });

    it("emits Released", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await expect(escrow.connect(inspector).approve(0)).to.emit(escrow, "Released").withArgs(0, amount);
    });

    it("only the inspector can approve", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await expect(escrow.connect(buyer).approve(0)).to.be.revertedWithCustomError(escrow, "NotInspector");
      await expect(escrow.connect(exporter).approve(0)).to.be.revertedWithCustomError(escrow, "NotInspector");
    });

    it("cannot approve before shipping", async function () {
      await openDeal();
      await expect(escrow.connect(inspector).approve(0)).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });

    it("cannot pay out twice", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await escrow.connect(inspector).approve(0);
      await expect(escrow.connect(inspector).approve(0)).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("reject", function () {
    it("refunds the buyer when the inspector rejects", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await expect(escrow.connect(inspector).reject(0, "Moisture above 12%"))
        .to.changeEtherBalances([buyer, escrow], [amount, -amount]);
      expect((await escrow.getDeal(0)).status).to.equal(3); // Refunded
    });

    it("emits Refunded with the reason", async function () {
      await openDeal();
      await expect(escrow.connect(inspector).reject(0, "Never shipped"))
        .to.emit(escrow, "Refunded").withArgs(0, amount, "Never shipped");
    });

    it("only the inspector can reject", async function () {
      await openDeal();
      await expect(escrow.connect(buyer).reject(0, "x")).to.be.revertedWithCustomError(escrow, "NotInspector");
    });

    it("cannot reject after release", async function () {
      await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await escrow.connect(inspector).approve(0);
      await expect(escrow.connect(inspector).reject(0, "x")).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("claimRefund", function () {
    it("lets the buyer reclaim after the deadline", async function () {
      const { deadline } = await openDeal();
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(buyer).claimRefund(0))
        .to.changeEtherBalances([buyer, escrow], [amount, -amount]);
      expect((await escrow.getDeal(0)).status).to.equal(3);
    });

    it("blocks refunds before the deadline", async function () {
      await openDeal();
      await expect(escrow.connect(buyer).claimRefund(0)).to.be.revertedWithCustomError(escrow, "DeadlineNotReached");
    });

    it("only the buyer can claim", async function () {
      const { deadline } = await openDeal();
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(exporter).claimRefund(0)).to.be.revertedWithCustomError(escrow, "NotBuyer");
    });

    it("cannot refund a released deal", async function () {
      const { deadline } = await openDeal();
      await escrow.connect(exporter).markShipped(0, "x");
      await escrow.connect(inspector).approve(0);
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(buyer).claimRefund(0)).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("multiple deals", function () {
    it("keeps each deal's funds separate", async function () {
      const deadline = await deadlineIn(30);
      await escrow.connect(buyer).createDeal(exporter.address, inspector.address, deadline, "Coffee", { value: amount });
      await escrow.connect(stranger).createDeal(exporter.address, inspector.address, deadline, "Sesame", { value: amount * 2n });
      await escrow.connect(exporter).markShipped(1, "x");
      await expect(escrow.connect(inspector).approve(1)).to.changeEtherBalance(exporter, amount * 2n);
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(amount);
      expect((await escrow.getDeal(0)).status).to.equal(0);
    });

    it("reverts on unknown deal ids", async function () {
      await expect(escrow.getDeal(5)).to.be.revertedWithCustomError(escrow, "UnknownDeal");
    });
  });
});
