import { Server } from './server';
import { Service, ServiceResponse } from './service';
import { ARWEAVE_GATEWAY, POSTS_SHEET_ID, REPLIES_SHEET_ID } from '../app/util/consts';

export class ActivityService extends Service {
  constructor() {
    super();
  }

  public async init(): Promise<ServiceResponse> {
    return {success: true};
  }

  public async sync(): Promise<ServiceResponse> {
    return {success: true};
  }

  // posts
  public async createPost(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createPost]');

      const cid = await Server.public.uploadToArweave(params);

      const row = {
        CID: cid,
        Author: Server.user.getId(),
        Email: '',
        Replies: 0,
        Likes: 0,
        URL: ARWEAVE_GATEWAY + cid,
        Tags: params.hashtag ? params.hashtag : '',
        Date: Date.now() / 1000,
      };
  
      await Server.public.addRowToSheet(POSTS_SHEET_ID, row);

      let end = performance.now();
      console.log(`<== [createPost] [${Math.round(end - start)} ms] ${JSON.stringify(row)}`);
      
      return {success: true, cid: cid};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [createPost]'};
    }
  }

  public async createReply(postCid: string, params: any) {
    try {
      let start = performance.now();
      console.log('==> [createReply]');

      const cid = await Server.public.uploadToArweave(params);

      const row = {
        PostCID: postCid,
        ReplyCID: cid,
        Author: params.author,
        Replies: 0,
        Likes: 0,
        URL: ARWEAVE_GATEWAY + cid,
        Date: Date.now() / 1000,
      };
  
      await Server.public.addRowToSheet(REPLIES_SHEET_ID, row);

      // update the Replies column in the Posts sheet
      let rows = await Server.public.getSheetRows(POSTS_SHEET_ID);
      for (let i = 0; i < rows.length; i++) {
        if (postCid == rows[i].CID) {
          rows[i].Replies++;
          await rows[i].save();
          break;
        }
      }

      let end = performance.now();
      console.log(`<== [createReply] [${Math.round(end - start)} ms] ${JSON.stringify(row)}`);
      
      return {success: true, cid: cid};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [createReply]'};
    }
  }

  public async likePost(cid: string, like: boolean) {
    try {
      let start = performance.now();
      console.log('==> [likePost]');

      let rows = await Server.public.getSheetRows(POSTS_SHEET_ID);

      for (let i = 0; i < rows.length; i++) {
        if (cid == rows[i].CID) {
          let id = Server.user.getId() + ',';

          if (like) {
            rows[i].Likes++;
            rows[i].Liked += id;
          }
          else {
            rows[i].Likes--;
            rows[i].Liked = rows[i].Liked.replace(id, '');
          }

          await rows[i].save();
          break;
        }
      }

      let end = performance.now();
      console.log(`<== [likePost] [${Math.round(end - start)} ms]`);
      
      return {success: true};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [likePost]'};
    }
  }

  public async getPosts() {
    try {
      let start = performance.now();
      console.log('==> [getPosts]');

      let posts = [];
      let rows  = await Server.public.getSheetRows(POSTS_SHEET_ID);

      for (let i = rows.length - 1; i >= 0 ; i--) {
        let content = await Server.public.downloadFromArweave(rows[i].URL);
        let post = {
          cid:     rows[i].CID,
          author:  rows[i].Author,
          tags:    rows[i].Tags,
          content: content,
          replies: Number(rows[i].Replies),
          likes:   Number(rows[i].Likes),
          liked:   rows[i].Liked,
          date:    rows[i].Date,
        };

        posts.push(post);
        Server.public.addPostToCache(post);
      }

      let end = performance.now();
      console.log(`<== [getPosts] [${Math.round(end - start)} ms]`);
      
      return {success: true, posts};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [getPosts]'};
    }
  }

  public async getReplies(cid: string) {
    try {
      let start = performance.now();
      console.log('==> [getReplies]');

      let replies = [];
      let rows    = await Server.public.getSheetRows(REPLIES_SHEET_ID);
  
      for (let i = 0; i < rows.length; i++) {
        if (cid == rows[i].PostCID) {
          let content = await Server.public.downloadFromArweave(rows[i].URL);
          replies.push({
            author:  rows[i].Author,
            content: content,
            liked:   rows[i].Liked,
            date:    rows[i].Date
          })
        }
      }
  
      let end = performance.now();
      console.log(`<== [getReplies] [${Math.round(end - start)} ms]`);
      
      return {success: true, replies};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [getReplies]'};
    }
  }

  public async getPost(cid: string) {
    try {
      let start = performance.now();
      console.log('==> [getPost]');

      let post;
      let rows = await Server.public.getSheetRows(POSTS_SHEET_ID);

      for (let i = 0; i < rows.length; i++) {
        if (cid == rows[i].CID) {
          let content  = await Server.public.downloadFromArweave(rows[i].URL);
          let response = await this.getReplies(cid);
          Server.public.addRepliesToCache(cid, response.replies);

          post = {
            cid:     rows[i].CID,
            author:  rows[i].Author,
            tags:    rows[i].Tags,
            content: content,
            replies: response.replies,
            likes:   Number(rows[i].Likes),
            liked:   rows[i].Liked,
            date:    rows[i].Date,
          };
          
          break;
        }
      }

      let end = performance.now();
      console.log(`<== [getPost] [${Math.round(end - start)} ms]`);
      
      return {success: true, post};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [getPost]'};
    }
  }
}