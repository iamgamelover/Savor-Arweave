import { ARWEAVE_GATEWAY, MISSIONS_SHEET_ID, PLANS_SHEET_ID, RESOURCES_SHEET_ID } from '../app/util/consts';
import { getFirstImage } from '../app/util/util';
import { Server } from './server';
import { Service, ServiceResponse } from './service';

export class PlansService extends Service {
  constructor() {
    super();
  }

  public async init(): Promise<ServiceResponse> {
    return {success: true};
  }

  public async sync(): Promise<ServiceResponse> {
    return {success: true};
  }

  // Plans
  public async createPlan(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createPlan]');

      const cid = await Server.public.uploadToArweave(params);

      const row = {
        CID: cid,
        Publisher: params.publisher,
        Title: params.title,
        Slug: params.slug,
        Banner: params.banner,
        Summary: params.summary,
        Missions: 0,
        Today: 0,
        URL: ARWEAVE_GATEWAY + cid,
        Date: Date.now() / 1000,
      };
  
      await Server.public.addRowToSheet(PLANS_SHEET_ID, row);

      let end = performance.now();
      console.log(`<== [createPlan] [${Math.round(end - start)} ms] ${JSON.stringify(row)}`);
      
      return {success: true, cid: cid};
    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [createPlan]'};
    }
  }

  public async createMission(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createMission]');

      const cid = await Server.public.uploadToArweave(params);

      const row = {
        PlanCID: params.planCid, 
        PlanTitle: params.planTitle,
        MissionCID: cid,
        Award: params.award,
        Career: params.career,
        Replies: 0,
        Likes: 0,
        URL: ARWEAVE_GATEWAY + cid,
        Date: Date.now() / 1000,
      };
  
      await Server.public.addRowToSheet(MISSIONS_SHEET_ID, row);

      // update the Missions column in the Plans sheet
      let rows = await Server.public.getSheetRows(PLANS_SHEET_ID);
      for (let i = 0; i < rows.length; i++) {
        if (params.planCid == rows[i].CID) {
          rows[i].Missions++;
          await rows[i].save();
          break;
        }
      }

      let end = performance.now();
      console.log(`<== [createMission] [${Math.round(end - start)} ms] ${JSON.stringify(row)}`);
      
      return {success: true, cid: cid};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [createMission]'};
    }
  }

  public async getPlans() {
    try {
      let start = performance.now();
      console.log('==> [getPlans]');

      let plans = [];
      let rows  = await Server.public.getSheetRows(PLANS_SHEET_ID);

      for (let i = 0; i < rows.length; i++) {
        let plan = await this.getPlanContent(rows[i]);
        plans.push(plan);
        Server.public.addPlanToCache(plan);
      }
  
      let end = performance.now();
      console.log(`<== [getPlans] [${Math.round(end - start)} ms]`);
      
      return {success: true, plans};
    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [getPlans]'};
    }
  }

  public async getPlan(slug: string) {
    try {
      let start = performance.now();
      console.log('==> [getPlan]');

      let rows = await Server.public.getSheetRows(PLANS_SHEET_ID);
  
      let plan;
      for (let i = 0; i < rows.length; i++) {
        if (slug == rows[i].Slug) {
          plan = await this.getPlanContent(rows[i]);
          Server.public.addPlanToCache(plan);
          break;
        }
      }
  
      let end = performance.now();
      console.log(`<== [getPlan] [${Math.round(end - start)} ms]`);
      
      return {success: true, plan};
    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [getPlan]'};
    }
  }

  protected async getPlanContent(row: any) {
    let content = await Server.public.downloadFromArweave(row.URL);
    let image   = getFirstImage(content);

    let plan = {
      cid:       row.CID,
      title:     row.Title,
      slug:      row.Slug,
      publisher: row.Publisher,
      summary:   row.Summary,
      missions:  row.Missions,
      today:     row.Today,
      banner:    row.Banner,
      image:     image ? image : '/plan-default.jpg',
      content:   content,
      date:      row.Date
    };

    return plan;
  }

  public async getMissions(planTitle?: string) {
    try {
      let start = performance.now();
      console.log('==> [getMissions]');

      let missions = [];
      let rows  = await Server.public.getSheetRows(MISSIONS_SHEET_ID);

      for (let i = rows.length - 1; i >= 0 ; i--) {
        let mission = await this.getMissionContent(rows[i]);
        missions.push(mission);
        Server.public.addMissionToCache(mission);
      }

      if (planTitle) // for the plan page
        missions = missions.filter((item) => {
          return item.planTitle == planTitle;
        });

      let end = performance.now();
      console.log(`<== [getMissions] [${Math.round(end - start)} ms]`);
      
      return {success: true, missions};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [getMissions]'};
    }
  }

  public async getMission(cid: string) {
    try {
      let start = performance.now();
      console.log('==> [getMission]');

      let rows = await Server.public.getSheetRows(MISSIONS_SHEET_ID);
  
      let mission;
      for (let i = 0; i < rows.length; i++) {
        if (cid == rows[i].MissionCID) {
          mission = await this.getMissionContent(rows[i]);
          Server.public.addMissionToCache(mission);
          break;
        }
      }
  
      let end = performance.now();
      console.log(`<== [getMission] [${Math.round(end - start)} ms]`);
      
      return {success: true, mission};

    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [getMission]'};
    }
  }

  protected async getMissionContent(row: any) {
    let content = await Server.public.downloadFromArweave(row.URL);

    let mission = {
      cid:       row.MissionCID,
      planTitle: row.PlanTitle,
      award:   row.Award,
      career:  row.Career,
      content: content,
      replies: Number(row.Replies),
      likes:   Number(row.Likes),
      date:    row.Date,
    };

    return mission;
  }

  public async createResource(params: any) {
    try {
      let start = performance.now();
      console.log('==> [createResource]');

      const cid = await Server.public.uploadToArweave(params);

      const row = {
        MissionCID: params.missionCID,
        Category: params.category,
        Views: 0,
        URL: ARWEAVE_GATEWAY + cid,
        Date: Date.now() / 1000,
      };
  
      await Server.public.addRowToSheet(RESOURCES_SHEET_ID, row);

      let end = performance.now();
      console.log(`<== [createResource] [${Math.round(end - start)} ms] ${JSON.stringify(row)}`);
      
      return {success: true, cid: cid};
    } catch (error: any) {
      console.error("ERR:", error);
      return {success: false, message: 'Failed: [createResource]'};
    }
  }

  public async getResources(category?: string) {
    try {
      let start = performance.now();
      console.log('==> [getResources]');

      let resources = [];
      let rows  = await Server.public.getSheetRows(RESOURCES_SHEET_ID);

      for (let i = rows.length - 1; i >= 0 ; i--) {
        let content = await Server.public.downloadFromArweave(rows[i].URL);

        let resource = {
          cid:      rows[i].MissionCID,
          category: rows[i].Category,
          views:   rows[i].Views,
          content: content,
          date:    rows[i].Date,
        };

        resources.push(resource);
        // Server.public.addMissionToCache(mission);
      }

      if (category)
        resources = resources.filter((item) => {
          return item.category == category;
        });

      let end = performance.now();
      console.log(`<== [getResources] [${Math.round(end - start)} ms]`);
      
      return {success: true, resources};

    } catch (error) {
      console.log("ERR:", error);
      return {success: false, message: 'Failed: [getResources]'};
    }
  }

}