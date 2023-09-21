import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Service } from './service';
import BadWords from '../app/util/badWords';
import { Server } from './server';
import { genAPI, genNodeAPI, getTokenTagByEver } from 'arseeding-js';
import { ARWEAVE_GATEWAY, ETH_TAG } from '../app/util/consts';
import { fetchGraphQL, msOfNow } from '../app/util/util';

declare var window: any;

export class PublicService extends Service {
  protected profiles:any;
  protected posts:any;
  protected post:any;
  protected replies:any;
  protected topics:any;
  protected topic:any;
  protected missions:any;
  protected mission:any;
  protected position:number;

  constructor() {
    super();
    this.profiles = [];
    this.post = [];
    this.replies = [];
    this.topic = [];
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
      let response = await Server.public.getProfileFromServer(missing[i]);
      if(!response.success) continue;
    }

    return {success: true};
  }

  public async loadProfileFromId(id:string) {
    if(this.profiles[id])
      return {success: true, profile: this.profiles[id]};

    let response = await Server.public.getProfileFromServer(id);

    if(!response.success)
      return {success: false, message: 'User is not exist.'};

    let profile = response.user;
    // this.addProfileToCache(profile);

    return {success: true, profile};
  }

  public addProfileToCache(profile:any) {
    this.profiles[profile.id] = profile;
    // this.profiles[profile.slug] = profile;
  }

  public addPostToCache(post:any) {
    this.post[post.id] = post;
  }

  public getPostFromCache(id:string) {
    return this.post[id];
  }

  public addRepliesToCache(id:string, replies:any) {
    this.replies[id] = replies;
  }

  public getRepliesFromCache(id:string) {
    return this.replies[id];
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

  public addTopisToCache(topics:any) {
    this.topics = topics;
  }

  public getTopicsFromCache() {
    return this.topics;
  }

  public removeTopicsFromCache() {
    this.topics = null;
  }

  public addTopicToCache(topic:any) {
    this.topic[topic.id] = topic;
  }

  public getTopicFromCache(id:string) {
    return this.topic[id];
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
    this.mission[mission.id] = mission;
  }

  public getMissionFromCache(id:string) {
    return this.mission[id];
  }

  public async downloadFromArweave(url: string) {
    let resp = await fetch(url);
    let data = await resp.json();
    let content = decodeURIComponent(data.content);
    content     = BadWords.clean(content);
    return content;
  }

  /**
   * Upload content (JSON format) to Arweave via Arseeding
   */
  public async uploadToArweave(params: any, opts: any) {
    // const instance = await genAPI(window.ethereum);
    const instance = genNodeAPI(process.env.REACT_APP_PRIV_KEY);
    const content  = Buffer.from(JSON.stringify(params));
    const payTag   = ETH_TAG; // everpay supported all tokens
    const response = await instance.sendAndPay(ARWEAVE_GATEWAY, content, payTag, opts);
    console.log("--> uploadToArweave", response)
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

  public async registerUser(address: string) {
    let result = await this.getProfileFromServer(address);
    
    // user is existed
    if (!result.success) return;
    if (result.user) {
      console.log("User is exist.")
      return result.user;
    }

    // New user
    let start = performance.now();
    console.log('==> [registerUser]');

    const params = {content: encodeURIComponent(JSON.stringify({banner: '', portrait: ''}))};
    const shortName = address.substring(0, 6) + '...' + address.substring(address.length - 4);
    const opts = {
      tags: [
        { name: "Content-Type", value: "application/json" },
        { name: "table", value: process.env.REACT_APP_TABLE_USERS },
        { name: "address", value: address.toLowerCase() },
        { name: "name", value: shortName },
        { name: "bio", value: '' },
        { name: "email", value: '' },
        { name: "created_at", value: Date.now().toString() },
        { name: "updated_at", value: Date.now().toString() },
      ]
    };

    await Server.public.uploadToArweave(params, opts);

    let end = performance.now();
    console.log(`<== [registerUser] [${Math.round(end - start)} ms]`);

    let user = {
      id: address.toLowerCase(),
      name: shortName,
      bio: '',
      email: '',
      banner: '',
      portrait: '',
      created_at: Date.now().toString(),
      updated_at: Date.now().toString(),
    }

    return user;
  }

  public async getUsers() {
    let start = performance.now();
    console.log('==> [getUsers]');

    const queryObject = {
      query:
      `{
        transactions (
          first: 1000
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_USERS}"]
            }
          ]
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);

      let end = performance.now();
      console.log(`<== [getUsers] [${Math.round(end - start)} ms]`);
      
      return {success: true, response};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getUsers failed.'};
    }
  }

  public async getProfileFromServer(address: string) {
    let start = performance.now();
    console.log('==> [getProfileFromServer]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_USERS}"]
            }
            {
              name: "address",
              values: ["${address.toLowerCase()}"]
            }
          ]
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);

      let user;
      if (response.length !== 0) {
        let res  = await Server.public.downloadFromArweave(ARWEAVE_GATEWAY + response[0].node.id);
        let imgs = JSON.parse(res);
        let tags = response[0].node.tags;

        user = {
          id: tags[2].value,
          name: tags[3].value,
          bio: tags[4].value,
          email: tags[5].value,
          created_at: tags[6].value,
          updated_at: tags[7].value,
          banner: res ? imgs.banner : '',
          portrait: res ? imgs.portrait : '',
        }
        
        Server.public.addProfileToCache(user);
      }

      let end = performance.now();
      console.log(`<== [getProfileFromServer] [${Math.round(end - start)} ms]`);
      
      return {success: true, user};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getProfileFromServer failed.'};
    }
  }
}
