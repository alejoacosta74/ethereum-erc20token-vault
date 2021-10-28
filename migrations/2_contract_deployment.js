
const Coin = artifacts.require("StableCoinToken");
const MockOracle = artifacts.require("MockOracle"); 
const ChainlinkOracle = artifacts.require("PriceConsumerV3"); 
const Vault = artifacts.require("Vault"); 

module.exports = async function (deployer) {
  await deployer.deploy(Coin, "ARX Stable", "ARX");
  const coin = await Coin.deployed();
  await deployer.deploy(MockOracle);
  const mOracle = await MockOracle.deployed();
  await deployer.deploy(ChainlinkOracle);
  const oracle = await ChainlinkOracle.deployed();
  await deployer.deploy(Vault, coin.address, oracle.address);
  const vault = await Vault.deployed();

};