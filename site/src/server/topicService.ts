import { ARWEAVE_GATEWAY } from '../app/util/consts';
import { fetchGraphQL, getFirstImage, uuid } from '../app/util/util';
import { Server } from './server';
import { Service, ServiceResponse } from './service';

export class TopicService extends Service {
  constructor() {
    super();
  }

  public async init(): Promise<ServiceResponse> {
    return {success: true};
  }

  public async sync(): Promise<ServiceResponse> {
    return {success: true};
  }

  // Topics
  public async createTopic(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createTopic]');

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_TOPICS },
          { name: "id", value: uuid() },
          { name: "title", value: params.title },
          { name: "author", value: Server.user.getId() },
          { name: "publisher", value: params.publisher },
          { name: "summary", value: params.summary },
          { name: "banner", value: params.banner },
          { name: "category", value: params.category },
          { name: "coins", value: '0' },
          { name: "missions", value: '0' },
          { name: "url", value: '' },
          { name: "created_at", value: Date.now().toString() },
          { name: "updated_at", value: Date.now().toString() },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      let end = performance.now();
      console.log(`<== [createTopic] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [createTopic]'};
    }
  }

  public async createMission(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createMission]');

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_MISSIONS },
          { name: "id", value: uuid() },
          { name: "author", value: Server.user.getId() },
          { name: "doing", value: '0' },
          { name: "learning", value: '0' },
          { name: "coins", value: '0' },
          { name: "award", value: params.award },
          { name: "dream", value: params.dream },
          { name: "topic_id", value: params.topicId },
          { name: "url", value: '' },
          { name: "created_at", value: Date.now().toString() },
          { name: "updated_at", value: Date.now().toString() },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      // update the property missions of the topic
      await this.updateTopic(params.topicId, '');
  
      let end = performance.now();
      console.log(`<== [createMission] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [createMission]'};
    }
  }

  public async updateTopic(topicId: string, params: any) {
    try {
      let start = performance.now();
      console.log('==> [updateTopic]');

      let res      = await this.getTopic(topicId);
      let topic    = res.topic;
      let missions = Number(topic.missions) + 1;

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_TOPICS },
          { name: "id", value: topic.id },
          { name: "title", value: topic.title },
          { name: "author", value: topic.author },
          { name: "publisher", value: topic.publisher },
          { name: "summary", value: topic.summary },
          { name: "banner", value: topic.banner },
          { name: "category", value: topic.category },
          { name: "coins", value: topic.coins },
          { name: "missions", value: missions.toString() },
          { name: "url", value: topic.url },
          { name: "created_at", value: topic.created_at },
          { name: "updated_at", value: Date.now().toString() },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      let end = performance.now();
      console.log(`<== [updateTopic] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [updateTopic]'};
    }
  }

  public async getTopics() {
    let start = performance.now();
    console.log('==> [getTopics]');

    const queryObject = {
      query:
      `{
        transactions (
          first: 1000
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_TOPICS}"]
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
      let data = this.removeDuplicate(response);

      let topics = [];
      for (let i = 0; i < data.length; i++) {
        let topic = await this.getTopicContent(data[i]);
        topics.push(topic);
        Server.public.addTopicToCache(topic);
      }

      Server.public.addTopisToCache(topics);

      let end = performance.now();
      console.log(`<== [getTopics] [${Math.round(end - start)} ms]`);
      
      return {success: true, topics};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getTopics failed.'};
    }
  }

  public async getTopic(id: string) {
    let start = performance.now();
    console.log('==> [getTopic]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_TOPICS}"]
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

      let topic;
      if (response.length !== 0) {
        topic = await this.getTopicContent(response[0]);
        Server.public.addTopicToCache(topic);
      }

      let end = performance.now();
      console.log(`<== [getTopic] [${Math.round(end - start)} ms]`);
      
      return {success: true, topic};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getTopic failed.'};
    }
  }

  protected async getTopicContent(data: any) {
    let tags    = data.node.tags;
    let block   = data.node.block;
    let url     = tags[11].value ? tags[11].value : ARWEAVE_GATEWAY + data.node.id;

    let topic = {
      id: tags[2].value,
      title: tags[3].value,
      author: tags[4].value,
      publisher: tags[5].value,
      summary: tags[6].value,
      banner: tags[7].value,
      category: tags[8].value,
      coins: tags[9].value,
      missions: tags[10].value,
      url: url,
      created_at: tags[12].value,
      updated_at: tags[13].value,
      content: '',
      image: '/topic-default.jpg',
      block_id: block.id,
      block_height: block.height, // number
      block_timestamp: block.timestamp, // seconds
    }

    return topic;
  }

  public async getMissions() {
    let start = performance.now();
    console.log('==> [getMissions]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_MISSIONS}"]
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
      let data = this.removeDuplicate(response);

      let missions = [];
      for (let i = 0; i < data.length; i++) {
        let mission = await this.getMissionContent(data[i]);
        missions.push(mission);
        Server.public.addMissionToCache(mission);
      }

      Server.public.addMissionsToCache(missions);

      let end = performance.now();
      console.log(`<== [getMissions] [${Math.round(end - start)} ms]`);
      
      return {success: true, missions};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getMissions failed.'};
    }
  }

  public async getMissionsOfTopic(topicId: string) {
    let start = performance.now();
    console.log('==> [getMissionsOfTopic]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_MISSIONS}"]
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
      let data = this.removeDuplicate(response);

      let missions = [];
      for (let i = 0; i < data.length; i++) {
        let mission = await this.getMissionContent(data[i]);
        missions.push(mission);
        Server.public.addMissionToCache(mission);
      }

      Server.public.addMissionsOfTopicToCache(missions, topicId);

      let end = performance.now();
      console.log(`<== [getMissionsOfTopic] [${Math.round(end - start)} ms]`);
      
      return {success: true, missions};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getMissionsOfTopic failed.'};
    }
  }

  public async getMissionsOfAuthor(author: string) {
    let start = performance.now();
    console.log('==> [getMissionsOfAuthor]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_MISSIONS}"]
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
      let data = this.removeDuplicate(response);

      let missions = [];
      for (let i = 0; i < data.length; i++) {
        let mission = await this.getMissionContent(data[i]);
        missions.push(mission);
        Server.public.addMissionToCache(mission);
      }
      
      Server.public.addMissionsOfAuthorToCache(missions, author);

      let end = performance.now();
      console.log(`<== [getMissionsOfAuthor] [${Math.round(end - start)} ms]`);
      
      return {success: true, missions};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getMissionsOfAuthor failed.'};
    }
  }

  public async getMission(id: string) {
    let start = performance.now();
    console.log('==> [getMission]');

    const queryObject = {
      query:
      `{
        transactions (
          tags: [
            {
              name: "table",
              values: ["${process.env.REACT_APP_TABLE_MISSIONS}"]
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

      let mission;
      if (response.length !== 0) {
        mission = await this.getMissionContent(response[0]);
        Server.public.addMissionToCache(mission);
      }

      let end = performance.now();
      console.log(`<== [getMission] [${Math.round(end - start)} ms]`);
      
      return {success: true, mission};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'getMission failed.'};
    }
  }

  protected async getMissionContent(data: any) {
    let tags    = data.node.tags;
    let block   = data.node.block;
    let url     = tags[10].value ? tags[10].value : ARWEAVE_GATEWAY + data.node.id;
    // let content = await Server.public.downloadFromArweave(url);

    let mission = {
      id: tags[2].value,
      author: tags[3].value,
      doing: tags[4].value,
      learning: tags[5].value,
      coins: tags[6].value,
      award: tags[7].value,
      dream: tags[8].value,
      topic_id: tags[9].value,
      url: url,
      created_at: tags[11].value,
      updated_at: tags[12].value,
      // content: content,
      content: '',
      block_id: block.id,
      block_height: block.height, // number
      block_timestamp: block.timestamp, // seconds
    }

    return mission;
  }

  public async updateMission(missionId: string, missionIndex: string, params: any) {
    try {
      let start = performance.now();
      console.log('==> [updateMission]');

      let res      = await this.getMission(missionId);
      let mission  = res.mission;
      let doing    = mission.doing;
      let learning = mission.learning;

      if (missionIndex === '0')
        doing = Number(doing) + 1;
      else
        learning = Number(learning) + 1;

      const opts = {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "table", value: process.env.REACT_APP_TABLE_MISSIONS },
          { name: "id", value: mission.id },
          { name: "author", value: mission.author },
          { name: "doing", value: doing.toString() },
          { name: "learning", value: learning.toString() },
          { name: "coins", value: mission.coins },
          { name: "award", value: mission.award },
          { name: "dream", value: mission.dream },
          { name: "topic_id", value: mission.topic_id },
          { name: "url", value: mission.url },
          { name: "created_at", value: mission.created_at },
          { name: "updated_at", value: Date.now().toString() },
        ]
      };

      await Server.public.uploadToArweave(params, opts);

      let end = performance.now();
      console.log(`<== [updateMission] [${Math.round(end - start)} ms]`);
      
      return {success: true};
    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [updateMission]'};
    }
  }

  removeDuplicate(data: any) {
    let result = [];
    let ids    = [] as any;
    for (let i = 0; i < data.length; i++) {
      let id = data[i].node.tags[2].value;
      if (!ids.includes(id)) {
        ids.push(id);
        result.push(data[i]);
      }
    }

    return result;
  }
}