import React from 'react';
import './PlanPage.css'
import { Server } from '../../server/server';
import { BsCalendarWeek } from 'react-icons/bs';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import { checkContent } from './ActivityPage';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import parse, { attributesToProps } from 'html-react-parser';
import ViewImageModal from '../modals/ViewImageModal';
import { numberWithCommas } from '../util/util';
import MissionPanel from '../elements/MissionPanel';
import { subscribe } from '../util/event';

interface PlanPageState {
  plan: any;
  posts: any[];
  missions: any[];
  message: string;
  alert: string;
  loading: boolean;
  openImage: boolean;
  openEditor: boolean;
  showMoreDesc: boolean;
  balance: string;
  award: number;
  career: string;
}

class PlanPage extends React.Component<{}, PlanPageState> {
  isActivity = true;
  quillRef: any;
  wordCount = 0;
  imgUrl: string;

  parseOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.name === 'img') {
        const props = attributesToProps(domNode.attribs);
        return <img className='ql-editor-image' onClick={(e)=>this.tapImage(e, props.src)} {...props} />;
      }
    }
  };

  constructor(props: any) {
    super(props);
    this.state = {
      plan: '',
      posts: [],
      missions: [],
      message: '',
      alert: '',
      loading: false,
      openImage: false,
      openEditor: false,
      showMoreDesc: false,
      balance: '',
      award: 1,
      career: 'community',
    }

    this.onContentChange = this.onContentChange.bind(this);
    this.onAwardChange = this.onAwardChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onCareerChange = this.onCareerChange.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.getPlan();

    if (this.isActivity)
      this.getPosts();
    else
      this.getMissions();
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({openImage: true})
  }

  onClose() {
    this.setState({openImage: false});
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  onAwardChange(e: any) {
    this.setState({award: e.currentTarget.value});
  }

  onCareerChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({career: element.value});
  }

  async getPlan() {
    let slug = window.location.pathname.substring(6);
    let plan = Server.public.getPlanFromCache(slug);
    console.log("plan:", plan)

    if (!plan) {
      let response = await Server.plans.getPlan(slug);
      if (!response.success) return;
      plan = response.plan;
    }

    this.setState({plan});
  }

  async getPosts() {
    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let tags     = window.location.pathname.substring(6);
    let response = await Server.activity.getPosts();
    if (!response.success) return;

    let posts = response.posts;
    posts = posts.filter((item) => {
      return item.tags == tags;
    });

    console.log('PLAN: posts ->: ', posts)

    // cache profiles
    let profiles = [];
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].author && profiles.indexOf(posts[i].author) == -1)
        profiles.push(posts[i].author);
    }

    await Server.public.loadProfiles(profiles);
    this.setState({ posts, loading: false });
  }

  async getMissions() {
    if (this.state.missions.length == 0)
      this.setState({loading: true});
      
    // const balance = await Server.user.getBalanceOfLAC(Server.account.getWallet());
    // console.log("balance:", balance)
    // this.setState({balance});

    // let slug     = window.location.pathname.substring(6);
    let response = await Server.plans.getMissions(this.state.plan.title);
    if (!response.success) return;

    console.log('PLAN: missions ->: ', response.missions)
    this.setState({ missions: response.missions, loading: false });
  }

  onFilter(filter: boolean) {
    if (this.isActivity == filter)
      return;

    this.isActivity = filter;
    // this.posLodMore = 0;

    // sessionStorage.setItem('plan-filter', this.isActivity.toString());

    if (this.isActivity) {
      this.setState({posts: [], openEditor: false});
      setTimeout(() => {
        this.getPosts();
      }, 10);
    }
    else {
      this.setState({missions: [], openEditor: false});
      setTimeout(() => {
        this.getMissions();
      }, 10);
    }
  }

  renderAward() {
    return (
      <div className="plan-page-input-container">
        <div className="plan-page-section-row">
          <div>Balance</div>
          <div style={{textAlign: 'right', marginRight: '8px'}}>{numberWithCommas(Number(this.state.balance))}</div>
          <img style={{width:'30px', marginTop: '4px'}} src='/coin.png' />
        </div>

        <div className="plan-page-section-row">
          <div>Award</div>
          <div className='plan-page-award-input'>
            x&nbsp;&nbsp;
            <input
              style={{width: '50px', textAlign: 'right'}} 
              value={this.state.award} 
              onChange={this.onAwardChange} 
            />
          </div>
          <img style={{width:'30px', marginTop: '4px'}} src='/coin.png' />
        </div>
      </div>
    )
  }

  renderCareer() {
    return (
      <div className="plan-page-input-container">
        <div className="plan-page-section-career">
          <div style={{display: 'flex', alignItems: 'center'}}>
            <img style={{width:'28px', marginRight: '10px'}} src='/icon/career.png' />
            <div>Career</div>
          </div>
          <select
            className="activity-page-filter" 
            value={this.state.career} 
            onChange={this.onCareerChange}
          >
            <option value="botanist">Botanist</option>
            <option value="astronaut">Astronaut</option>
            <option value="rocket-designer">Rocket Designer</option>
          </select>
        </div>
      </div>
    )
  }

  renderEditor(isActivity: boolean) {
    return (
      <div>
        <div className="plan-page-input-container">
          <SharedQuillEditor 
            placeholder = {isActivity ? 'Whats happening?' : 'Whats the new mission?'}
            onChange={this.onContentChange}
            getRef={(ref: any) => this.quillRef = ref}
          />
        </div>

        {!isActivity && 
          <div>
            {this.renderAward()}
            {this.renderCareer()}
          </div>
        }

        <div className='plan-page-actions'>
          {isActivity
            ?  <button onClick={()=>this.onPost()}>Post</button>
            :  <button onClick={()=>this.onMission()}>Publish</button>
          }
        </div>
      </div>
    )
  }

  renderPosts() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++)
      divs.push(<ActivityPost key={i} data={this.state.posts[i]} />);

    return divs.length > 0 ? divs : <div>No posts yet.</div>
  }

  renderMissions() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = 0; i < this.state.missions.length; i++)
      divs.push(<MissionPanel key={i} data={this.state.missions[i]} />);

    return divs.length > 0 ? divs : <div>No missions yet.</div>
  }

  async onPost() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    this.setState({message: 'Posting...'});

    let html   = this.quillRef.root.innerHTML;
    let params = {
      hashtag: this.state.plan.slug,
      content: encodeURIComponent(html)
    };

    let response = await Server.activity.createPost(params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: ''});
      this.getPosts();
    }
    else
      this.setState({message: '', alert: response.message})
  }

  async onMission() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    this.setState({message: 'Launch Mission...'});

    let html   = this.quillRef.root.innerHTML;
    let params = {
      award: this.state.award,
      career: this.state.career,
      planCid: this.state.plan.cid,
      planTitle: this.state.plan.title,
      content: encodeURIComponent(html)
    };

    let response = await Server.plans.createMission(params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: ''});
      this.getMissions();
    }
    else
      this.setState({message: '', alert: response.message})
  }
  
  onAlertClose() {
    this.setState({alert: ''});
  }

  onShowMoreDesc() {
    this.setState({showMoreDesc: !this.state.showMoreDesc});
  }

  render() {
    if (!this.state.plan) 
      return (<div>Loading...</div>);

    let plan = this.state.plan;
    let date = new Date(plan.date * 1000).toLocaleString();

    return (
      <div className='plan-page'>
        <div className='plan-page-header'>
          <img className="plan-page-banner" src={plan.banner} />
          <img className="plan-page-portrait" src={plan.image} />
        </div>

        <div className="plan-page-title">{plan.title}</div>
        <div className="plan-page-desc">{plan.summary}</div>
        <div className="plan-page-desc-more" onClick={()=>this.onShowMoreDesc()}>
          {this.state.showMoreDesc ? 'Show less' : 'Show more'}
        </div>
        
        {this.state.showMoreDesc &&
          <div className='plan-page-desc-more-panel'>
            {parse(plan.content, this.parseOptions)}
          </div>
        }

        <div className="plan-page-publisher">@{plan.publisher}</div>
        <div className='plan-page-joined-container'>
          <BsCalendarWeek color='white'/>
          <div className='plan-page-joined'>Launched {date}</div>
        </div>

        {/* <div className='plan-page-follow-container'>
          <div className="plan-page-follow-link" onClick={() => this.openUserList('following')}>
            {this.state.following.length} Following
          </div>
          <div className="plan-page-follow-link" onClick={() => this.openUserList('followers')}>
            {this.state.followers.length} Followers
          </div>
        </div> */}

        <div className='plan-page-social-container'>
          <div className='plan-page-social-header'>
            <div style={{display: 'flex'}}>
              <div className={`plan-page-filter ${this.isActivity ? 'selected' : ''}`} onClick={()=>this.onFilter(true)}>
                Activity
              </div>
              <div className={`plan-page-filter ${this.isActivity ? '' : 'selected'}`} onClick={()=>this.onFilter(false)}>
                Missions
              </div>
            </div>

            <button onClick={()=>this.setState({openEditor: !this.state.openEditor})}>
              {this.state.openEditor ? 'Cancel' : 'New'}
            </button>
          </div>

          {this.isActivity
            ? <div className='plan-page-blogs'>
                {this.state.openEditor && this.renderEditor(true)}
                {this.renderPosts()}
              </div>
            : <div className='plan-page-blogs'>
                {this.state.openEditor && this.renderEditor(false)}
                {this.renderMissions()}
              </div>
          }
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()}/>
        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    );
  }
}

export default PlanPage;