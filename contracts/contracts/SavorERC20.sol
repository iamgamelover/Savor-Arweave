// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SavorERC20 is ERC20 {
    constructor() ERC20("Test-Learn.Act.Change", "TestLAC") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}