// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/utils/Strings.sol";

contract Wallet {
    address[] public approvers;
    uint public quorum;
    struct Transfer {
        uint id;
        uint amount;
        address payable to;
        uint approvals;
        bool sent;
    }
    Transfer[] public transfers;
    mapping(address => mapping(uint => bool)) public approvals;

    constructor(address[] memory _approvers, uint _quorum) {
        approvers = _approvers;
        quorum = _quorum;
    }

    function getApprovers() external view returns(address[] memory) {
        return approvers;
    }

    function getTransfers() external view returns(Transfer[] memory) {
        return transfers;
    }

    function createTransfer(uint amount, address payable to) external onlyApprover() {
        transfers.push(
            Transfer({
                id: transfers.length, 
                amount: amount,
                to: to,
                approvals: 0,
                sent: false
            })
        );
    }

    function approveTransfer(uint id) external onlyApprover() {
        require(id < transfers.length, string.concat("Transfer #", Strings.toString(id), " does not exists."));
        require(!transfers[id].sent, string.concat("Transfer #", Strings.toString(id), " has already been sent."));
        require(!approvals[msg.sender][id], string.concat("You've already approved the transfer #", Strings.toString(id)));

        approvals[msg.sender][id] = true;

        if ( ++transfers[id].approvals >= quorum ) {
            transfers[id].sent = true;
            address payable to = transfers[id].to;
            uint amount = transfers[id].amount;
            to.transfer(amount);
        }
    }

    receive() external payable {}

    modifier onlyApprover() {
        bool allowed = false;
        for ( uint i; i < approvers.length; i++ ) {
            if (approvers[i] == msg.sender) {
                allowed = true;
            }
        }
        require(allowed, "Only authorized approvers are allowed to perform this action.");
        _;
    }
}