import { AccountService } from './accountService';
import { UserService } from './userService';
import { ServiceResponse } from './service';
import { PublicService } from './publicService';
import { ActivityService } from './activityService';
import { TopicService } from './topicService';
import Provider, { EthereumProvider } from '@walletconnect/ethereum-provider';
import { publish } from '../app/util/event';
import Web3 from 'web3';
import { providers } from "ethers";
import { WebBundlr } from "@bundlr-network/client";
import LoginModal from '../app/modals/LoginModal';

declare var window: any;

export class Server {
  public static account: AccountService = new AccountService();
  public static activity: ActivityService = new ActivityService();
  public static topic: TopicService = new TopicService();
  public static user: UserService = new UserService();
  public static public: PublicService = new PublicService();
  public static initialized: boolean = false;
  
  protected static signUpDetails: any = null;
  
  public static provider: Provider;
  public static web3: Web3;

  // Arweave
  public static bundlr: any;

  public static async init() {
    if (Server.account.isMetamaskLoggedIn()) {
      LoginModal.subscribeMetaMaskEvents();
      this.web3 = new Web3(window.ethereum);
    }
    // else
    //   await this.initProvider();

    if (Server.account.isLoggedIn()) {
      await Server.user.sync();
    }

    await Server.activity.getPosts();
    await Server.topic.getTopics();
    await Server.topic.getMissions();

    Server.initialized = true;
  }

  public static async initArweave() {
    await window.ethereum.enable();
    const provider = new providers.Web3Provider(window.ethereum);
    this.bundlr = new WebBundlr("https://node2.bundlr.network", "matic", provider);
    await this.bundlr.ready();
  }

  protected static async initProvider() {
    const projectId = process.env.REACT_APP_WC_PRJ_ID;
    this.provider  = await EthereumProvider.init({
      projectId: projectId,
      chains: [5, 1], // mainnet, goerli testnet
      showQrModal: true
    });

    this.web3 = new Web3(this.provider);

    this.provider.on("chainChanged", (chainId) => {
      console.log("chainChanged:", chainId);
    });

    // provider.on("connect", (accounts) => {
    //   console.log("WC connect:", accounts);
    // });

    this.provider.on("disconnect", (accounts) => {
      console.log("disconnect:", accounts);
      publish('wallet-events');
    });

    this.provider.on("accountsChanged", (accounts) => {
      console.log("accountsChanged:", accounts);
      publish('wallet-events');
    });
  }

  public static async signOut() {
    Server.user.clear();

    if (Server.account.isMetamaskLoggedIn())
      localStorage.removeItem('metamask');
    else
      await this.provider.disconnect();
      
    publish('wallet-events');
  }

}
