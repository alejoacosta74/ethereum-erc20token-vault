// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ICoin.sol";

contract StableCoinToken is ERC20, ICoin, Ownable {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
    }

    function mint(address account, uint256 amount) onlyOwner external override returns(bool){
        _mint(account, amount);
        return true;
    }

    function burn(address account, uint256 amount) onlyOwner external override returns(bool){
        _burn(account, amount);
        return true;
    }
    
}