import { AppConfig } from '../app/AppConfig';
import { ARWEAVE_GATEWAY, USERS_SHEET_ID } from '../app/util/consts';
import { Server } from './server';
import { Service, ServiceResponse } from './service';
import { ethers } from 'ethers';

const contractABI = require('../app/data/SavorERC20.json');

export class UserService extends Service {
  protected user: any;

  constructor() {
    super();
    this.user = null;
  }

  public async init(): Promise<ServiceResponse> {
    return {success: true};
  }
  
  public async sync(): Promise<ServiceResponse> {
    let id;
    if (Server.account.isMetamaskLoggedIn())
      id = Server.account.getMetamaskAccount();
    else
      id = Server.account.getWallet();

    let shortName = id.substring(0, 6) + '...' + id.substring(id.length - 4);

    let response = await this.getProfileFromServer(id);

    if (!response.user) {
      let params = {
        id: id,
        name: shortName,
        slug: '',
        banner: '',
        portrait: '',
        bio: '',
        email: '',
      };

      let response = await this.createProfile(params);
      if(!response.success)
        return {success: false};

      this.user = params;
      return {success: true};
    }

    this.user = response.user;
    return {success: true};
  }

  public async createProfile(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createProfile]');

      // const cid = await Server.public.uploadToIPFS(params);

      const row = {
        ID: params.id,
        Name: params.name,
        Slug: params.slug,
        Bio: params.bio,
        Email: params.email,
        Banner: params.banner,
        Portrait: params.portrait,
        Date: Date.now() / 1000,
      };
  
      await Server.public.addRowToSheet(USERS_SHEET_ID, row);

      let end = performance.now();
      console.log(`<== [createProfile] [${Math.round(end - start)} ms]`);
      
      return {success: true};

    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [createProfile]'};
    }
  }

  public async updateProfile(params: any) {
    try {
      let start = performance.now();
      console.log('==> [updateProfile]');

      let rows = await Server.public.getSheetRows(USERS_SHEET_ID);

      for (let i = 0; i < rows.length; i++) {
        if (params.id == rows[i].ID) {
          rows[i].Name     = params.name;
          rows[i].Bio      = params.bio;
          rows[i].Banner   = params.banner;
          rows[i].Portrait = params.portrait;

          await rows[i].save();

          this.user.name        = params.name;
          this.user.bio         = params.bio;
          this.user.portrait    = params.portraitBase64;
          this.user.portraitURL = params.portrait;
          this.user.banner      = params.bannerBase64;
          this.user.bannerURL   = params.banner;
          this.notifyListeners('user-profile-updated');
          break;
        }
      }

      let end = performance.now();
      console.log(`<== [updateProfile] [${Math.round(end - start)} ms]`);
      
      return {success: true};

    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [updateProfile]'};
    }
  }

  public async getProfileFromServer(id: string) {
    try {
      let start = performance.now();
      console.log('==> [getProfileFromServer]');

      let user;
      let rows = await Server.public.getSheetRows(USERS_SHEET_ID);

      for (let i = 0; i < rows.length; i++) {
        if (id == rows[i].ID) {
          let portrait = await Server.public.downloadFromArweave(rows[i].Portrait);
          let banner   = await Server.public.downloadFromArweave(rows[i].Banner);

          user = {
            id: rows[i].ID,
            name: rows[i].Name,
            slug: rows[i].Slug,
            banner: banner,
            bannerURL: rows[i].Banner,
            portrait: portrait,
            portraitURL: rows[i].Portrait,
            bio: rows[i].Bio,
            email: rows[i].Email,
            date: rows[i].Date,
          }

          Server.public.addProfileToCache(user);
          break;
        }
      }
  
      let end = performance.now();
      console.log(`<== [getProfileFromServer] [${Math.round(end - start)} ms]`);
      
      return {success: true, user};

    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [getProfileFromServer]'};
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

  public getSlug(): string {
    if(!this.user)
      return '';
    return this.user.slug;
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

  public getProfile():any {
    if(!this.user)
      return null;
      
    return {
      id: this.user.id,
      name: this.user.name,
      slug: this.user.slug,
      banner: this.user.banner,
      portrait: this.user.portrait,
      bio: this.user.bio
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
