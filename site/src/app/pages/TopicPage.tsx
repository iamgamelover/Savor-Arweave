import React from 'react';
import './TopicPage.css'
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
import { subscribe } from '../util/event';
import { TIPS_ARWEAVE } from '../util/consts';

interface TopicPageState {
  topic: any;
  posts: any[];
  missions: any[];
  message: string;
  alert: string;
  loading: boolean;
  openImage: boolean;
  openEditor: boolean;
  showMoreDesc: boolean;
  balance: string;
  award: string;
  dream: string;
}

class TopicPage extends React.Component<{}, TopicPageState> {
  isActivity = false;
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
      topic: '',
      posts: [],
      missions: [],
      message: '',
      alert: '',
      loading: false,
      openImage: false,
      openEditor: false,
      showMoreDesc: false,
      balance: '',
      award: '1',
      dream: 'explorer',
    }

    this.onContentChange = this.onContentChange.bind(this);
    this.onAwardChange = this.onAwardChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onDreamChange = this.onDreamChange.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.getTopic();

    if (this.isActivity)
      this.getPosts();
    else
      this.getMissionsOfTopic();
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

  onDreamChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({dream: element.value});
  }

  async getTopic() {
    let id    = window.location.pathname.substring(7);
    let topic = Server.public.getTopicFromCache(id);
    console.log("topic:", topic)

    if (!topic) {
      let response = await Server.topic.getTopic(id);
      if (!response.success) return;
      topic = response.topic;
    }

    this.setState({topic});
  }

  async getPosts() {
    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let id       = window.location.pathname.substring(7);
    let response = await Server.activity.getPosts();
    if (!response.success) return;

    let posts = response.posts;
    posts = posts.filter((item) => {
      return item.topic_id == id;
    });

    console.log('topic posts ->: ', posts)
    this.setState({ posts, loading: false });

    // cache profiles
    let profiles = [];
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].author && profiles.indexOf(posts[i].author) == -1)
        profiles.push(posts[i].author);
    }

    await Server.public.loadProfiles(profiles);
  }

  async getMissionsOfTopic() {
    if (this.state.missions.length == 0)
      this.setState({loading: true});
      
    // const balance = await Server.user.getBalanceOfLAC(Server.account.getWallet());
    // console.log("balance:", balance)
    // this.setState({balance});

    let id = window.location.pathname.substring(7);
    let response = await Server.topic.getMissionsOfTopic(id);
    if (!response.success) return;

    console.log('missions ->: ', response.missions)
    this.setState({ missions: response.missions, loading: false });
  }

  onFilter(filter: boolean) {
    if (this.isActivity == filter)
      return;

    this.isActivity = filter;
    // this.posLodMore = 0;

    // sessionStorage.setItem('topic-filter', this.isActivity.toString());

    if (this.isActivity) {
      this.setState({posts: [], openEditor: false});
      setTimeout(() => {
        this.getPosts();
      }, 10);
    }
    else {
      this.setState({missions: [], openEditor: false});
      setTimeout(() => {
        this.getMissionsOfTopic();
      }, 10);
    }
  }

  renderAward() {
    return (
      <div className="topic-page-input-container">
        <div className="topic-page-section-row">
          <div>Balance</div>
          <div style={{textAlign: 'right', marginRight: '8px'}}>{numberWithCommas(Number(this.state.balance))}</div>
          <img style={{width:'30px', marginTop: '4px'}} src='/coin.png' />
        </div>

        <div className="topic-page-section-row">
          <div>Award</div>
          <div className='topic-page-award-input'>
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

  renderDream() {
    return (
      <div className="topic-page-input-container">
        <div className="topic-page-section-career">
          <div style={{display: 'flex', alignItems: 'center'}}>
            <img style={{width:'28px', marginRight: '10px'}} src='/icon/career.png' />
            <div>Dream</div>
          </div>
          <select
            className="activity-page-filter" 
            value={this.state.dream} 
            onChange={this.onDreamChange}
          >
            <option value="Explorer">Explorer</option>
            <option value="Singer">Singer</option>
            <option value="Runner">Runner</option>
            <option value="Director">Director</option>
          </select>
        </div>
      </div>
    )
  }

  renderEditor(isActivity: boolean) {
    return (
      <div>
        <div className="topic-page-input-container">
          <SharedQuillEditor 
            placeholder = {isActivity ? 'Whats happening?' : 'Whats the new mission?'}
            onChange={this.onContentChange}
            getRef={(ref: any) => this.quillRef = ref}
          />
        </div>

        {!isActivity && 
          <div>
            {this.renderAward()}
            {this.renderDream()}
          </div>
        }

        <div className='topic-page-actions'>
          {isActivity
            ?  <button onClick={()=>this.onPost()}>Post</button>
            :  <button onClick={()=>this.onMission()}>Launch</button>
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
      divs.push(<ActivityPost key={i} data={this.state.missions[i]} isMission={true} />);

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
      topicId: this.state.topic.id,
      content: encodeURIComponent(html)
    };

    let response = await Server.activity.createPost(params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: '', alert: TIPS_ARWEAVE});
      // this.getPosts();
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
      dream: this.state.dream,
      topicId: this.state.topic.id,
      content: encodeURIComponent(html)
    };

    let response = await Server.topic.createMission(params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: '', alert: TIPS_ARWEAVE});
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
    if (!this.state.topic) 
      return (<div className='topic-page-loading'>Loading...</div>);

    let topic = this.state.topic;
    let date  = new Date(Number(topic.block_timestamp * 1000)).toLocaleString();

    return (
      <div className='topic-page'>
        <div className='topic-page-header'>
          <img className="topic-page-banner" src={topic.banner} />
          <img className="topic-page-portrait" src={topic.image} />
        </div>

        <div className="topic-page-title">{topic.title}</div>
        <div className="topic-page-desc">{topic.summary}</div>
        <div className="topic-page-desc-more" onClick={()=>this.onShowMoreDesc()}>
          {this.state.showMoreDesc ? 'Show less' : 'Show more'}
        </div>
        
        {this.state.showMoreDesc &&
          <div className='topic-page-desc-more-panel'>
            {parse(topic.content, this.parseOptions)}
          </div>
        }

        <div className="topic-page-publisher">@{topic.publisher}</div>
        <div className='topic-page-joined-container'>
          <BsCalendarWeek color='white'/>
          <div className='topic-page-joined'>Launched {date}</div>
        </div>

        {/* <div className='topic-page-follow-container'>
          <div className="topic-page-follow-link" onClick={() => this.openUserList('following')}>
            {this.state.following.length} Following
          </div>
          <div className="topic-page-follow-link" onClick={() => this.openUserList('followers')}>
            {this.state.followers.length} Followers
          </div>
        </div> */}

        <div className='topic-page-social-container'>
          <div className='topic-page-social-header'>
            <div style={{display: 'flex'}}>
              <div className={`topic-page-filter ${this.isActivity ? 'selected' : ''}`} onClick={()=>this.onFilter(true)}>
                Activity
              </div>
              <div className={`topic-page-filter ${this.isActivity ? '' : 'selected'}`} onClick={()=>this.onFilter(false)}>
                Missions
              </div>
            </div>

            {Server.account.isLoggedIn() &&
              <button onClick={()=>this.setState({openEditor: !this.state.openEditor})}>
                {this.state.openEditor ? 'Cancel' : 'New'}
              </button>
            }
          </div>

          {this.isActivity
            ? <div className='topic-page-blogs'>
                {this.state.openEditor && this.renderEditor(true)}
                {this.renderPosts()}
              </div>
            : <div className='topic-page-blogs'>
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

export default TopicPage;