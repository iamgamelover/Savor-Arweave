import { genNodeAPI } from 'arseeding-js';
import { AppConfig } from '../app/AppConfig';
import { ARWEAVE_GATEWAY, ETH_TAG } from '../app/util/consts';
import { Server } from './server';
import { Service, ServiceResponse } from './service';
import { ethers } from 'ethers';

const contractABI = require('../app/data/SavorERC20.json');

export class UserService extends Service {
  // protected user: any;
  public user: any;

  constructor() {
    super();
    this.user = null;
  }

  public async init(): Promise<ServiceResponse> {
    return {success: true};
  }
  
  public async sync(): Promise<ServiceResponse> {
    let address;
    if (Server.account.isMetamaskLoggedIn())
      address = Server.account.getMetamaskAccount();
    else
      address = Server.account.getWallet();

    this.user = await Server.public.registerUser(address);
    return {success: true};
  }

  public async updateProfile(params: any) {
    try {
      let start = performance.now();
      console.log('==> [updateProfile]');

      const data = {content: encodeURIComponent(JSON.stringify({banner: params.banner, portrait: params.portrait}))};
      const ops = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_USERS },
          { name: "address", value: params.id },
          { name: "name", value: params.name },
          { name: "bio", value: params.bio },
          { name: "email", value: params.email },
          { name: "created_at", value: params.created_at },
          { name: "updated_at", value: Date.now().toString() },
        ]
      };

      await Server.public.uploadToArweave(data, ops);

      this.user = params;
      this.notifyListeners('user-profile-updated');

      let end = performance.now();
      console.log(`<== [updateProfile] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [updateProfile]'};
    }
  }

  public clear() {
    this.user = null;
  }

  // profile
  public getId(): string {
    if(!this.user)
      return '';
    return this.user.id;
  }

  public isCurrent(id:string):boolean {
    return this.user.id == id;
  }

  public getName(): string {
    if(!this.user)
      return '';
    return this.user.name;
  }

  public getEmail(): string {
    if(!this.user)
      return '';
    return this.user.email;
  }

  public getBanner(): string {
    if(!this.user)
      return '';
    return this.user.banner;
  }

  public getBannerURL(): string {
    if(!this.user)
      return '';
    return this.user.bannerURL;
  }

  public getPortrait(): string {
    if(!this.user)
      return '';
    return this.user.portrait;
  }

  public getPortraitURL(): string {
    if(!this.user)
      return '';
    return this.user.portraitURL;
  }

  public getBio(): string {
    if(!this.user)
      return '';
    return this.user.bio;
  }

  public getCreatedAt(): string {
    if(!this.user)
      return '';
    return this.user.created_at;
  }

  public getProfile():any {
    if(!this.user)
      return null;
      
    return {
      id: this.user.id,
      name: this.user.name,
      banner: this.user.banner,
      portrait: this.user.portrait,
      bio: this.user.bio,
      email: this.user.email,
      created_at: this.user.created_at,
      updated_at: this.user.updated_at,
    }
  }

  // assets
  public getTokenCount(): number {
    let asset = this.getAsset(AppConfig.token.id);
    if(!asset)
      return 0;

    return asset.quantity;
  }

  public getCoinCount(): number {
    let asset = this.getAsset(AppConfig.coin.id);
    if(!asset)
      return 0;

    return asset.quantity;
  }

  public getAsset(id:string): any {
    if(!this.user)
      return null;

    let assets = this.user.assets;
    if(assets.length == 0)
      return null;

    for(let i = 0; i < assets.length; i++) 
      if(assets[i].id == id)
        return assets[i];

    return null;
  }

  public async getBalanceOfLAC(address: string) {
    let contract = new Server.web3.eth.Contract(contractABI.abi, '0x3b4C2526E8E1FA9513147FA6f00c0e2dC25f52DA');
    
    try {
      let balance = await contract.methods.balanceOf(address).call();
      return Server.web3.utils.fromWei(balance);
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  public async transferFrom(from: string, to: string, amount: string) {
    // address = '0x556b6862FA670Cfb5aA96c56BFED4fa04eACfc7c'
    let contract = new Server.web3.eth.Contract(contractABI.abi, '0x3b4C2526E8E1FA9513147FA6f00c0e2dC25f52DA');
    let value = Server.web3.utils.toWei(amount, "ether");
    console.log("value:", value)

    try {
      // Approve an allowance
      const value  = Server.web3.utils.toWei('90000', "ether");
      const result = await contract.methods.approve(from, value).send({ from });
      console.log('Approve:', result);

      let response = await contract.methods.transferFrom(from, to, value).send({ from });
      return response;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
