import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Service } from './service';
import BadWords from '../app/util/badWords';
import { Server } from './server';
import { genAPI, genNodeAPI, getTokenTagByEver } from 'arseeding-js';

declare var window: any;

export class PublicService extends Service {
  protected profiles:any;
  protected posts:any;
  protected post:any;
  protected replies:any;
  protected plans:any;
  protected plan:any;
  protected missions:any;
  protected mission:any;
  protected position:number;

  constructor() {
    super();
    this.profiles = [];
    this.post = [];
    this.replies = [];
    this.plan = [];
    this.mission = [];
  }

  public getProfile(id:string) {
    return this.profiles[id];
  }

  public async loadProfiles(ids:string[]) {
    let missing = [];
    for(let i = 0; i < ids.length; i++)
      if(!this.profiles[ids[i]])
        missing.push(ids[i]);

    if(missing.length == 0)
      return {success: true};

    for(let i = 0; i < missing.length; i++) {
      let response = await Server.user.getProfileFromServer(missing[i]);
      if(!response.success) continue;
    }

    return {success: true};
  }

  public async loadProfileFromId(id:string) {
    if(this.profiles[id])
      return {success: true, profile: this.profiles[id]};

    let response = await Server.user.getProfileFromServer(id);

    if(!response.success)
      return {success: false, message: 'User is not exist.'};

    let profile = response.user;
    this.addProfileToCache(profile);

    return {success: true, profile};
  }

  public addProfileToCache(profile:any) {
    this.profiles[profile.id] = profile;
    // this.profiles[profile.slug] = profile;
  }

  public addPostToCache(post:any) {
    this.post[post.cid] = post;
  }

  public getPostFromCache(cid:string) {
    return this.post[cid];
  }

  public addRepliesToCache(cid:string, replies:any) {
    this.replies[cid] = replies;
  }

  public getRepliesFromCache(cid:string) {
    return this.replies[cid];
  }

  public addPostsToCache(posts:any) {
    this.posts = posts;
  }
  
  public getPostsFromCache() {
    return this.posts;
  }

  public removePostsFromCache() {
    this.posts = null;
  }

  public addPositionToCache(position:number) {
    this.position = position;
  }

  public getPositionFromCache() {
    return this.position;
  }

  public addPlansToCache(plans:any) {
    this.plans = plans;
  }

  public getPlansFromCache() {
    return this.plans;
  }

  public removePlansFromCache() {
    this.plans = null;
  }

  public addPlanToCache(plan:any) {
    this.plan[plan.slug] = plan;
  }

  public getPlanFromCache(slug:string) {
    return this.plan[slug];
  }

  public addMissionsToCache(missions:any) {
    this.missions = missions;
  }

  public getMissionsFromCache() {
    return this.missions;
  }

  public removeMissionsFromCache() {
    this.missions = null;
  }

  public addMissionToCache(mission:any) {
    this.mission[mission.cid] = mission;
  }

  public getMissionFromCache(cid:string) {
    return this.mission[cid];
  }

  public async getGoogleSheet() {
    let start = performance.now();
    console.log('==> [getGoogleSheet]');

    // Config variables
    const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
    const CLIENT_EMAIL   = process.env.REACT_APP_GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY    = process.env.REACT_APP_GOOGLE_SERVICE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

    try {
      await doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      });

      // loads document properties and worksheets
      await doc.loadInfo();

      let end = performance.now();
      console.log(`<== [getGoogleSheet] [${Math.round(end - start)} ms]`);

      return doc;
    } catch (error) {
      console.error('Error: ', error);
      return null;
    }
  }

  public async getSheetRows(sheetId: string) {
    const sheet = Server.GoogleSheet.sheetsById[sheetId];
    const rows  = await sheet.getRows();
    return rows;
  }

  public async addRowToSheet(sheetId: string, row: any) {
    const sheet = Server.GoogleSheet.sheetsById[sheetId];
    await sheet.addRow(row);
  }

  public async downloadFromArweave(url: string) {
    try {
      // let start = performance.now();
      // console.log('==> [downloadFromArweave]');

      let resp = await fetch(url);
      let data = await resp.json();
      let content = decodeURIComponent(data.content);
      content     = BadWords.clean(content);

      // let end = performance.now();
      // console.log(`<== [downloadFromArweave] [${Math.round(end - start)} ms]`);
    
      return content;
    } catch (error) {
      return null;
    }
  }

  /**
   * Upload content (JSON format) to Arweave via Arseeding
   * @param content JSON format
   * @returns CID
   */
  public async uploadToArweave(content: any) {
    let start = performance.now();
    console.log('==> [uploadToArweave]');

    const instance = await genAPI(window.ethereum);
    // const instance = genNodeAPI(process.env.REACT_APP_PRIV_KEY);

    const arseedUrl = 'https://arseed.web3infra.dev';
    const data = Buffer.from(JSON.stringify(content));
    const payCurrencyTag = 'ethereum-eth-0x0000000000000000000000000000000000000000'; // everpay supported all tokens
    const ops = {tags: [{name: "Content-Type", value:'application/json'}]};
    const res = await instance.sendAndPay(arseedUrl, data, payCurrencyTag, ops);

    let end = performance.now();
    console.log(`<== [uploadToArweave] [${Math.round(end - start)} ms]`);
    
    return res.order.itemId;
  }

  public async uploadToArweaveViaBundlr(content: any) {
    let start = performance.now();
    console.log('==> [uploadToArweave]');

    // Upload data
    const response = await Server.bundlr.upload(JSON.stringify(content));

    let end = performance.now();
    console.log(`<== [uploadToArweave] [${Math.round(end - start)} ms]`);
    
    return response.id;
  }
}
