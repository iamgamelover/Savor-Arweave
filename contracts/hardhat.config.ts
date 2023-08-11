import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  defaultNetwork: "goerli",

  networks: {
    hardhat: {},
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
  },

  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY as any,
    },
  },
};

export default config;