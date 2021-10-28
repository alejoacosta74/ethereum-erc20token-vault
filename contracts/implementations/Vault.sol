// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IVault.sol";
import "./Coin.sol";
import "./PriceConsumerV3.sol";
import "./MockOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Vault is IVault, Ownable {

    mapping (address => Vault) vaults;
    StableCoinToken public token;
    PriceConsumerV3 private oracle;
    // using SafeMath for uint256;

    constructor(StableCoinToken _token, PriceConsumerV3 _oracle){
        token = _token;
        oracle = _oracle;
    }

    /**
    @notice Allows a user to deposit ETH collateral in exchange for some amount of stablecoin
    @param amountToDeposit  The amount of ether the user sent in the transaction
     */
    function deposit(uint256 amountToDeposit) override payable external {
        require(amountToDeposit == msg.value, "incorrect ETH amount");
        uint256 amountToMint = amountToDeposit * getEthUSDPrice();
        token.mint(msg.sender, amountToMint);
        vaults[msg.sender].collateralAmount += amountToDeposit;
        vaults[msg.sender].debtAmount += amountToMint;
        emit Deposit(amountToDeposit, amountToMint);
    }
    
    /**
    @notice Allows a user to withdraw up to 100% of the collateral they have on deposit
    @dev This cannot allow a user to withdraw more than they put in
    @param repaymentAmount  the amount of stablecoin that a user is repaying to redeem their collateral for.
     */
    function withdraw(uint256 repaymentAmount) override external {
        require(repaymentAmount <= vaults[msg.sender].debtAmount, "withdraw limit exceeded"); 
        require(token.balanceOf(msg.sender) >= repaymentAmount, "not enough tokens in balance");
        uint256 amountToWithdraw = repaymentAmount / getEthUSDPrice();
        token.burn(msg.sender, repaymentAmount);
        vaults[msg.sender].collateralAmount -= amountToWithdraw;
        vaults[msg.sender].debtAmount -= repaymentAmount;
        payable(msg.sender).transfer(amountToWithdraw);
        emit Withdraw(amountToWithdraw, repaymentAmount);
    }

    
    /**
    @notice Returns the details of a vault
    @param userAddress  the address of the vault owner
    @return vault  the vault details
     */
    function getVault(address userAddress) external view override returns(Vault memory vault) {
        return vaults[userAddress];
    }
    
    /**
    @notice Returns an estimate of how much collateral could be withdrawn for a given amount of stablecoin
    @param repaymentAmount  the amount of stable coin that would be repaid
    @return collateralAmount the estimated amount of a vault's collateral that would be returned 
     */
    function estimateCollateralAmount(uint256 repaymentAmount) external view override  returns(uint256 collateralAmount) {
        return repaymentAmount / getEthUSDPrice();
    }
    
    /**
    @notice Returns an estimate on how much stable coin could be minted at the current rate
    @param depositAmount the amount of ETH that would be deposited
    @return tokenAmount  the estimated amount of stablecoin that would be minted
     */
    function estimateTokenAmount(uint256 depositAmount) external view override returns(uint256 tokenAmount) {
        return depositAmount * getEthUSDPrice();
    }

    function getEthUSDPrice() public view returns (uint256){
        uint price8 = uint(oracle.getLatestPrice());
        return price8*(10**10);
    }

    function getToken() external view returns (address){
        return address(token);
    }

    function setOracle(address _oracle) public onlyOwner {
        oracle = PriceConsumerV3(_oracle);
    }

    function getOracle() public view returns (address) {
        return address(oracle);
    }
}
