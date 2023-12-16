import { Server } from './server';
import { Service, ServiceResponse } from './service';
import { ARWEAVE_GATEWAY, ETH_TAG } from '../app/util/consts';
import { genNodeAPI } from 'arseeding-js';
import { fetchGraphQL, removeDuplicate, uuid } from '../app/util/util';

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
  public async createPost(params: any, isMission?: boolean) {
    try {
      let start = performance.now();
      console.log('==> [createPost]');

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_POSTS },
          { name: "id", value: uuid() },
          { name: "author", value: Server.user.getId() },
          { name: "replies", value: '0' },
          { name: "coins", value: '0' },
          { name: "topic_id", value: params.topicId ? params.topicId : '' },
          { name: "url", value: '' },
          { name: "created_at", value: Date.now().toString() },
          { name: "updated_at", value: Date.now().toString() },
          { name: "mission_id", value: params.missionId ? params.missionId : '' },
          { name: "mission_index", value: params.missionIndex ? params.missionIndex : '' },
          { name: "range", value: params.range ? params.range : '' },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      // update the property replies of the post
      if (isMission)
        await Server.topic.updateMission(params.missionId, params.missionIndex, '');

      let end = performance.now();
      console.log(`<== [createPost] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [createPost]'};
    }
  }

  public async createReply(postId: string, params: any) {
    try {
      let start = performance.now();
      console.log('==> [createReply]');

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_REPLIES },
          { name: "id", value: uuid() },
          { name: "post_id", value: postId },
          { name: "author", value: Server.user.getId() },
          { name: "coins", value: '0' },
          { name: "tags", value: params.hashtag ? params.hashtag : '' },
          { name: "url", value: '' },
          { name: "created_at", value: Date.now().toString() },
          { name: "updated_at", value: Date.now().toString() },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      // update the property replies of the post
      await this.updatePost(postId, '');

      let end = performance.now();
      console.log(`<== [createReply] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [createReply]'};
    }
  }

  public async updatePost(postId: string, params: any) {
    try {
      let start = performance.now();
      console.log('==> [updatePost]');

      let res     = await this.getPost(postId);
      let post    = res.post;
      let replies = Number(post.replies) + 1;

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_POSTS },
          { name: "id", value: post.id },
          { name: "author", value: post.author},
          { name: "replies", value: replies.toString() },
          { name: "coins", value: post.coins },
          { name: "topic_id", value: post.topic_id },
          { name: "url", value: post.url },
          { name: "created_at", value: post.created_at },
          { name: "updated_at", value: Date.now().toString() },
          { name: "mission_id", value: post.mission_id },
          { name: "mission_index", value: post.mission_index },
          { name: "range", value: post.range },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      let end = performance.now();
      console.log(`<== [updatePost] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [updatePost]'};
    }
  }

  public async getPosts() {
    let start = performance.now();
    console.log('==> [getPosts]');

    const queryObject = {
      query:
      `{
        transactions (
          first: 10
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_POSTS}"]
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
              block {
                id
                timestamp
                height
                previous
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);
      let data = removeDuplicate(response);
      
      let posts = [];
      for (let i = 0; i < data.length; i++) {
        let post = await this.getPostContent(data[i]);
        if (post.range === 'private') {
          if (post.author === Server.user.getId()) {
            posts.push(post);
            Server.public.addPostToCache(post);
          }
        }
        else {
          posts.push(post);
          Server.public.addPostToCache(post);
        }
      }
      
      Server.public.addPostsToCache(posts);

      let end = performance.now();
      console.log(`<== [getPosts] [${Math.round(end - start)} ms]`);
      
      return {success: true, posts};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getPosts failed.'};
    }
  }

  public async getPostsOfAuthor(author: string) {
    let start = performance.now();
    console.log('==> [getPostsOfAuthor]');

    const queryObject = {
      query:
      `{
        transactions (
          first: 10
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_POSTS}"]
            }
            {
              name: "author",
              values: ["${author}"]
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
              block {
                id
                timestamp
                height
                previous
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);
      let data = removeDuplicate(response);
      
      let posts = [];
      for (let i = 0; i < data.length; i++) {
        let post = await this.getPostContent(data[i]);
        if (post.range === 'private') {
          if (author === Server.user.getId()) {
            posts.push(post);
            Server.public.addPostToCache(post);
          }
        }
        else {
          posts.push(post);
          Server.public.addPostToCache(post);
        }
      }

      Server.public.addPostsOfAuthorToCache(posts, author);

      let end = performance.now();
      console.log(`<== [getPostsOfAuthor] [${Math.round(end - start)} ms]`);
      
      return {success: true, posts};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getPostsOfAuthor failed.'};
    }
  }

  public async getPostsOfTopic(topicId: string) {
    let start = performance.now();
    console.log('==> [getPostsOfTopic]');

    const queryObject = {
      query:
      `{
        transactions (
          first: 10
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_POSTS}"]
            }
            {
              name: "topic_id",
              values: ["${topicId}"]
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
              block {
                id
                timestamp
                height
                previous
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);
      let data = removeDuplicate(response);
      
      let posts = [];
      for (let i = 0; i < data.length; i++) {
        let post = await this.getPostContent(data[i]);
        posts.push(post);
        Server.public.addPostToCache(post);
      }
      
      Server.public.addPostsOfTopicToCache(posts, topicId);

      let end = performance.now();
      console.log(`<== [getPostsOfTopic] [${Math.round(end - start)} ms]`);
      
      return {success: true, posts};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getPostsOfTopic failed.'};
    }
  }

  public async getReplies(postId: string) {
    let start = performance.now();
    console.log('==> [getReplies]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_REPLIES}"]
            }
            {
              name: "post_id",
              values: ["${postId}"]
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
              block {
                id
                timestamp
                height
                previous
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);

      let replies = [];
      for (let i = 0; i < response.length; i++) {
        let tags    = response[i].node.tags;
        let block   = response[i].node.block;
        let url     = tags[7].value ? tags[7].value : ARWEAVE_GATEWAY + response[i].node.id;
        let content = await Server.public.downloadFromArweave(url);
      
        let reply = {
          id: tags[2].value,
          author: tags[4].value,
          coins: tags[5].value,
          tags: tags[6].value,
          url: url,
          created_at: tags[8].value,
          updated_at: tags[9].value,
          content: content,
          block_id: block.id,
          block_height: block.height, // number
          block_timestamp: block.timestamp, // seconds
        }

        replies.push(reply);
      }

      let end = performance.now();
      console.log(`<== [getReplies] [${Math.round(end - start)} ms]`);
      
      return {success: true, replies};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getReplies failed.'};
    }
  }

  public async getPost(id: string) {
    let start = performance.now();
    console.log('==> [getPost]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_POSTS}"]
            }
            {
              name: "id",
              values: ["${id}"]
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
              block {
                id
                timestamp
                height
                previous
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);

      let post;
      if (response.length !== 0) {
        post = await this.getPostContent(response[0]);
        Server.public.addPostToCache(post);
      }
      
      let end = performance.now();
      console.log(`<== [getPost] [${Math.round(end - start)} ms]`);
      
      return {success: true, post};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getPost failed.'};
    }
  }

  public async getPostsOfMission(missionId: string, missionIndex: string) {
    let start = performance.now();
    console.log('==> [getPostsOfMission]');

    const queryObject = {
      query:
      `{
        transactions (
          first: 1000
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_POSTS}"]
            }
            {
              name: "mission_id",
              values: ["${missionId}"]
            }
            {
              name: "mission_index",
              values: ["${missionIndex}"]
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
              block {
                id
                timestamp
                height
                previous
              }
            }
          }
        }
      }`
    };

    try {
      let response = await fetchGraphQL(queryObject);
      let data = removeDuplicate(response);

      let posts = [];
      for (let i = 0; i < data.length; i++) {
        let post = await this.getPostContent(data[i]);
        posts.push(post);
        Server.public.addPostToCache(post);
      }
      
      Server.public.addPostsOfMissionToCache(posts, missionIndex);

      let end = performance.now();
      console.log(`<== [getPostsOfMission] [${Math.round(end - start)} ms]`);
      
      return {success: true, posts};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getPostsOfMission failed.'};
    }
  }

  protected async getPostContent(data: any) {
    let tags    = data.node.tags;
    let block   = data.node.block;
    let url     = tags[7].value ? tags[7].value : ARWEAVE_GATEWAY + data.node.id;
  
    // TODO: will be removed at next big version
    let range;
    if (tags[12]) range = tags[12].value;
    
    // check the block
    if (!block) {
      block = {id: '', height: 0, timestamp: 0}
    }
    
    let post = {
      id: tags[2].value,
      author: tags[3].value,
      replies: tags[4].value,
      coins: tags[5].value,
      topic_id: tags[6].value,
      url: url,
      created_at: tags[8].value,
      updated_at: tags[9].value,
      mission_id: tags[10].value,
      mission_index: tags[11].value,
      range: range,
      content: '',
      block_id: block.id,
      block_height: block.height, // number
      block_timestamp: block.timestamp, // seconds
    }

    return post;
  }
}