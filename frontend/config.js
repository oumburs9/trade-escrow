// Deployed TradeEscrow on Sepolia: https://sepolia.etherscan.io/address/0xf34A750283881792Fff8BF85C3F0C13C996aA266
window.ESCROW_CONFIG = {
  "address": "0xf34A750283881792Fff8BF85C3F0C13C996aA266",
  "chainId": 11155111,
  "abi": [
    {
      "inputs": [],
      "name": "DeadlineInPast",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "DeadlineNotReached",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidParty",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NoPayment",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotBuyer",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotExporter",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInspector",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TransferFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "UnknownDeal",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "WrongStatus",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "exporter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "inspector",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "product",
          "type": "string"
        }
      ],
      "name": "DealCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "Refunded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Released",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "shipmentRef",
          "type": "string"
        }
      ],
      "name": "Shipped",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        }
      ],
      "name": "claimRefund",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "exporter",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "inspector",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "product",
          "type": "string"
        }
      ],
      "name": "createDeal",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "dealCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        }
      ],
      "name": "getDeal",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "exporter",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "inspector",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "enum TradeEscrow.Status",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "product",
              "type": "string"
            }
          ],
          "internalType": "struct TradeEscrow.Deal",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "shipmentRef",
          "type": "string"
        }
      ],
      "name": "markShipped",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "dealId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "reject",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};
