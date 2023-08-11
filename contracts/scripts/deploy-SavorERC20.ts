// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  let balance = await deployer.getBalance();
  let numBala = ethers.utils.formatEther(balance);
  console.log("Account balance:", numBala);

  // We get the contract to deploy
  const Savor = await hre.ethers.getContractFactory("SavorERC20");
  const savor = await Savor.deploy();

  await savor.deployed();

  console.log("SavorERC20 deployed to:", savor.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
