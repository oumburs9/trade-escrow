// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TradeEscrow
/// @notice Holds an importer's payment until an independent inspector confirms
///         that the exporter's shipment arrived as agreed. Built for agricultural
///         commodity exports (coffee, chickpeas, sesame...) where buyer and seller
///         are in different countries and a bank Letter of Credit is slow and costly.
contract TradeEscrow {
    enum Status {
        Funded,   // buyer has deposited payment
        Shipped,  // exporter says goods are on the way
        Released, // inspector approved, exporter paid
        Refunded  // inspector rejected or deadline passed, buyer refunded
    }

    struct Deal {
        address buyer;
        address exporter;
        address inspector;
        uint256 amount;
        uint256 deadline; // after this, buyer can reclaim funds if not released
        Status status;
        string product;   // e.g. "20 t Dark Kabuli chickpeas, 8mm"
    }

    Deal[] private deals;

    event DealCreated(
        uint256 indexed dealId,
        address indexed buyer,
        address indexed exporter,
        address inspector,
        uint256 amount,
        uint256 deadline,
        string product
    );
    event Shipped(uint256 indexed dealId, string shipmentRef);
    event Released(uint256 indexed dealId, uint256 amount);
    event Refunded(uint256 indexed dealId, uint256 amount, string reason);

    error InvalidParty();
    error NoPayment();
    error DeadlineInPast();
    error NotBuyer();
    error NotExporter();
    error NotInspector();
    error WrongStatus();
    error DeadlineNotReached();
    error TransferFailed();
    error UnknownDeal();

    modifier exists(uint256 dealId) {
        if (dealId >= deals.length) revert UnknownDeal();
        _;
    }

    /// @notice Buyer opens a deal and deposits the full payment.
    function createDeal(
        address exporter,
        address inspector,
        uint256 deadline,
        string calldata product
    ) external payable returns (uint256 dealId) {
        if (msg.value == 0) revert NoPayment();
        if (exporter == address(0) || inspector == address(0)) revert InvalidParty();
        if (exporter == msg.sender || inspector == msg.sender || inspector == exporter) revert InvalidParty();
        if (deadline <= block.timestamp) revert DeadlineInPast();

        dealId = deals.length;
        deals.push(Deal({
            buyer: msg.sender,
            exporter: exporter,
            inspector: inspector,
            amount: msg.value,
            deadline: deadline,
            status: Status.Funded,
            product: product
        }));

        emit DealCreated(dealId, msg.sender, exporter, inspector, msg.value, deadline, product);
    }

    /// @notice Exporter confirms the goods have been shipped.
    function markShipped(uint256 dealId, string calldata shipmentRef) external exists(dealId) {
        Deal storage d = deals[dealId];
        if (msg.sender != d.exporter) revert NotExporter();
        if (d.status != Status.Funded) revert WrongStatus();
        d.status = Status.Shipped;
        emit Shipped(dealId, shipmentRef);
    }

    /// @notice Inspector confirms delivery and quality; payment goes to the exporter.
    function approve(uint256 dealId) external exists(dealId) {
        Deal storage d = deals[dealId];
        if (msg.sender != d.inspector) revert NotInspector();
        if (d.status != Status.Shipped) revert WrongStatus();
        d.status = Status.Released;
        _send(d.exporter, d.amount);
        emit Released(dealId, d.amount);
    }

    /// @notice Inspector rejects the shipment; payment goes back to the buyer.
    function reject(uint256 dealId, string calldata reason) external exists(dealId) {
        Deal storage d = deals[dealId];
        if (msg.sender != d.inspector) revert NotInspector();
        if (d.status != Status.Funded && d.status != Status.Shipped) revert WrongStatus();
        d.status = Status.Refunded;
        _send(d.buyer, d.amount);
        emit Refunded(dealId, d.amount, reason);
    }

    /// @notice If the deadline passes without approval, the buyer can take the money back.
    function claimRefund(uint256 dealId) external exists(dealId) {
        Deal storage d = deals[dealId];
        if (msg.sender != d.buyer) revert NotBuyer();
        if (d.status != Status.Funded && d.status != Status.Shipped) revert WrongStatus();
        if (block.timestamp <= d.deadline) revert DeadlineNotReached();
        d.status = Status.Refunded;
        _send(d.buyer, d.amount);
        emit Refunded(dealId, d.amount, "Deadline passed");
    }

    function getDeal(uint256 dealId) external view exists(dealId) returns (Deal memory) {
        return deals[dealId];
    }

    function dealCount() external view returns (uint256) {
        return deals.length;
    }

    function _send(address to, uint256 amount) private {
        (bool ok, ) = to.call{ value: amount }("");
        if (!ok) revert TransferFailed();
    }
}
