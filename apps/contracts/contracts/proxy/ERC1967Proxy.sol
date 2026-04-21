// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Thin wrapper so Hardhat generates an artifact for use in Ignition deploy modules.
contract UUPSProxy is ERC1967Proxy {
    constructor(address impl, bytes memory data) ERC1967Proxy(impl, data) {}
}
