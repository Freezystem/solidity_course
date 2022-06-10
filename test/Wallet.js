const { expectRevert } = require("@openzeppelin/test-helpers");
const Wallet = artifacts.require("Wallet");

contract("Wallet", (accounts) => {
    let wallet;
    let walletBalanceBefore;
    let walletBalanceAfter;
    let walletBalanceDiff;
    let receiverBalanceBefore;
    let receiverBalanceAfter;
    let receiverBalanceDiff;

    beforeEach(async () => {
        wallet = await Wallet.new(accounts.slice(0, 3), 2);
        await web3.eth.sendTransaction({
            from: accounts[0],
            to: wallet.address,
            value: 1000,
        })
    });

    it("Should have correct approvers", async () => {
        const approvers = await wallet.getApprovers();
        assert.equal(approvers.length, 3, "There should be 3 approvers");
        assert.equal(approvers[0], accounts[0], "First approver should be first account from list");
        assert.equal(approvers[1], accounts[1], "Second approver should be second account from list");
        assert.equal(approvers[2], accounts[2], "Third approver should be third account from list");
    });

    it("Should have correct quorum", async () => {
        const quorum = await wallet.quorum();
        assert.equal(quorum.toNumber(), 2, "Quorum should equals 2");
    });

    it("Should not create a transfer if approver is invalid", async () => {
        await expectRevert(
            wallet.createTransfer(100, accounts[0], {from: accounts[5]}),
            "Only authorized approvers are allowed to perform this action."
        );

        const transfers = await wallet.getTransfers();
        assert.equal(transfers.length, 0, "There should be no transfer");
    });

    it("Should create a transfer", async () => {
        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});

        const transfers = await wallet.getTransfers();
        assert.equal(transfers.length, 1, "There should be 1 transfer");
        assert.equal(transfers[0].id, "0", "Transfer ID should be 0");
        assert.equal(transfers[0].amount, "100", "Transfer amount should be 100");
        assert.equal(transfers[0].to, accounts[5], "Transfer receipient should match account 5 address");
        assert.equal(transfers[0].approvals, "0", "Transfer should have no approval yet");
        assert.equal(transfers[0].sent, false, "Transfer should not have been sent");
    });

    it("Should return an error when transfer does not exists", async () => {
        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[0]}),
            "Transfer #0 does not exists."
        );
    });

    it("Should return an error when approving transfer with an invalid approver", async () => {
        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[6]}),
            "Only authorized approvers are allowed to perform this action."
        );
    });

    it("Should approve a transfer but not send it", async () => {
        walletBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(wallet.address));

        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});

        walletBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(wallet.address));

        const transfers = await wallet.getTransfers();
        assert.equal(transfers.length, 1, "There should be 1 transfer");
        assert.equal(transfers[0].id, "0", "Transfer ID should be 0");
        assert.equal(transfers[0].amount, "100", "Transfer amount should be 100");
        assert.equal(transfers[0].to, accounts[5], "Transfer receipient should match account 5 address");
        assert.equal(transfers[0].approvals, "1", "Transfer should have one approval");
        assert.equal(transfers[0].sent, false, "Transfer should not have been sent");

        walletBalanceDiff = walletBalanceAfter.sub(walletBalanceBefore).toNumber();
        assert.equal(walletBalanceDiff, 0, "Wallet balance should not have changed");
    });

    it("Should not be possible to approve a transfer twice", async () => {
        walletBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(wallet.address));

        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});

        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[0]}),
            "You've already approved the transfer #0"
        );

        walletBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(wallet.address));

        const transfers = await wallet.getTransfers();
        assert.equal(transfers.length, 1, "There should be 1 transfer");
        assert.equal(transfers[0].id, "0", "Transfer ID should be 0");
        assert.equal(transfers[0].amount, "100", "Transfer amount should be 100");
        assert.equal(transfers[0].to, accounts[5], "Transfer receipient should match account 5 address");
        assert.equal(transfers[0].approvals, "1", "Transfer should have one approval");
        assert.equal(transfers[0].sent, false, "Transfer should not have been sent");

        walletBalanceDiff = walletBalanceAfter.sub(walletBalanceBefore).toNumber();
        assert.equal(walletBalanceDiff, 0, "Wallet balance should not have changed");
    });

    it("Should send transfer once quorum is reached", async () => {
        walletBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(wallet.address));
        receiverBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[5]));

        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[2]});

        walletBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(wallet.address));
        receiverBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[5]));

        const transfers = await wallet.getTransfers();
        assert.equal(transfers.length, 1, "There should be 1 transfer");
        assert.equal(transfers[0].id, "0", "Transfer ID should be 0");
        assert.equal(transfers[0].amount, "100", "Transfer amount should be 100");
        assert.equal(transfers[0].to, accounts[5], "Transfer receipient should match account 5 address");
        assert.equal(transfers[0].approvals, "2", "Transfer should have two approvals");
        assert.equal(transfers[0].sent, true, "Transfer should have been sent");

        walletBalanceDiff = walletBalanceAfter.sub(walletBalanceBefore).toNumber();
        assert.equal(walletBalanceDiff, -100, "Wallet should have sent 100 weis");
        receiverBalanceDiff = receiverBalanceAfter.sub(receiverBalanceBefore).toNumber();
        assert.equal(receiverBalanceDiff, 100, "Receipient should have gain 100 weis");
    });

    it("Should return an error when approving an already sent transfer", async () => {
        walletBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(wallet.address));
        receiverBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[5]));

        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});

        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[2]}),
            "Transfer #0 has already been sent."
        );

        walletBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(wallet.address));
        receiverBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[5]));

        walletBalanceDiff = walletBalanceAfter.sub(walletBalanceBefore).toNumber();
        assert.equal(walletBalanceDiff, -100, "Wallet should have sent 100 weis");
        receiverBalanceDiff = receiverBalanceAfter.sub(receiverBalanceBefore).toNumber();
        assert.equal(receiverBalanceDiff, 100, "Receipient should have gain 100 weis");
    });
});
