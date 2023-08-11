import { AccountService } from './accountService';
import { UserService } from './userService';
import { ServiceResponse } from './service';
import { PublicService } from './publicService';
import { ActivityService } from './activityService';
import { PlansService } from './plansService ';
import Provider, { EthereumProvider } from '@walletconnect/ethereum-provider';
import { publish } from '../app/util/event';
import Web3 from 'web3';
import { providers } from "ethers";
import { WebBundlr } from "@bundlr-network/client";

declare var window: any;

export class Server {
  public static account: AccountService = new AccountService();
  public static activity: ActivityService = new ActivityService();
  public static plans: PlansService = new PlansService();
  public static user: UserService = new UserService();
  public static public: PublicService = new PublicService();
  public static initialized: boolean = false;
  
  protected static signUpDetails: any = null;
  
  // Objects of Google Sheet
  public static GoogleSheet: any;
  public static provider: Provider;
  public static web3: Web3;

  // Arweave
  public static bundlr: any;

  public static async init() {
    // load objects of Google Sheet
    this.GoogleSheet = await Server.public.getGoogleSheet();

    if (Server.account.isMetamaskLoggedIn()) {
      this.web3 = new Web3(window.ethereum);
      await this.initArweave();
    }
    // else
    //   await this.initProvider();

    if (Server.account.isLoggedIn())
      await Server.user.sync();

    await this.getPlans();

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

  protected static async getPlans() {
    let response = await Server.plans.getPlans();
    if (!response.success) return;
    Server.public.addPlansToCache(response.plans);
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
