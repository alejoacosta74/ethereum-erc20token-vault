const Vault = artifacts.require("Vault");
const mockOracle = artifacts.require("MockOracle");
const chainlinkOracle = artifacts.require("PriceConsumerV3");
const Token = artifacts.require("StableCoinToken");
const {expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
const toBN = web3.utils.toBN;
const {printEvents, toWei} = require("./utils");
const test_network = process.env.TEST_NETWORK;

contract("Vault", (accounts) => {

  let token, receipt, oracle, vault, user = accounts[1], owner = accounts[0], itinialEthBalance, updatedEthBalance, finalEthBalance, initialTokenBalance, 
  updatedTokenBalance, finalTokenBalance;

  before(async ()=>{
    if (test_network=="kovan"){
      oracle = await chainlinkOracle.new({from: owner})
    }
    else {
      oracle = await mockOracle
    } 
    token = await Token.new("Stable Coin", "STBL", {from: owner});
    vault = await Vault.new(token.address, oracle.address, {from: owner});
    await token.transferOwnership(vault.address, {from: owner})
    updatedEthBalance = await web3.eth.getBalance(user);
    initialTokenBalance = await token.balanceOf(user);
  })

  describe ("Use Case 1: user deposits ether and receives stablecoin ", async ()=>{
    before (async() => {
      receipt = await vault.deposit(toWei('1'),{from: user, value: toWei('1')});
      updatedTokenBalance = await token.balanceOf(user);
    })

    it("should update user Vault collateral with sent Ether", async ()=>{
      let userVault = await vault.getVault(user);
      assert.equal(toWei("1"), userVault.collateralAmount, "user collateral amount does not match sent ether");
    })

    it("should fire a 'Deposit' event", ()=>{
      expectEvent(receipt, "Deposit");
    })

    it ("should update user token balance", async ()=>{
      let ethPrice = await vault.getEthUSDPrice();
      let expectedTokenBalance = toBN(toWei('1')).mul(ethPrice);
      assert.equal(updatedTokenBalance.toString(), expectedTokenBalance.toString(), "user Token balance not updated with right amount")
    })

    it ("should update user Vault debt", async ()=>{
      let userVault = await vault.getVault(user);
      assert.equal(updatedTokenBalance.toString(), userVault.debtAmount.toString(), "user Vault debt not updated with right amount")
    })

    it("should provide a estimated token amount with accuracy > 90%", async () =>{
      let estimatedTokenAmount = await vault.estimateTokenAmount(toWei('1'));
      let tokensMinted = receipt.logs[0].args.amountMinted;
      let diff = toBN(estimatedTokenAmount).div(tokensMinted);
      assert(Math.abs(1 - parseInt(diff.toString()))<=0.1);
    })
  })

  describe ("Use Case 2: user repays ALL tokens and withdraws ether ", async ()=>{
    before(async () => {
      receipt = await vault.withdraw(updatedTokenBalance.toString(),{from: user});
      finalEthBalance = await web3.eth.getBalance(user);
      finalTokenBalance = await token.balanceOf(user);
    })

    it("should fire a 'Withdraw' event", async ()=>{
      expectEvent(receipt, "Withdraw");
    })

    it ("user token balance should be zero", async ()=>{
      assert.equal(finalTokenBalance.toString(), "0", "user Token balance should be zero after repayment")
    })

    it ("user vault debt should be zero", async ()=>{
      let userVault = await vault.getVault(user);
      assert.equal("0", userVault.debtAmount.toString(), "user Vault debt is not zero after repayment")
    })

    it("should provide a estimated repayment amount with accuracy > 90%", async () =>{
      let estimatedCollateralAmount = await vault.estimateCollateralAmount(updatedTokenBalance.toString());
      let collateralWithdrawn = receipt.logs[0].args.collateralWithdrawn;
      let diff = toBN(estimatedCollateralAmount).div(collateralWithdrawn);
      assert(Math.abs(1 - parseInt(diff.toString()))<=0.1);
    })
  })
});
