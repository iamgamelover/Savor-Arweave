import React from 'react';
import { Server } from '../../server/server';
import { getBannerImage, getPortraitImage, msOfNow, uniqueId } from '../util/util';
import { BsCalendarWeek, BsChatDotsFill, BsGiftFill, BsFillEyeFill, BsFillEyeSlashFill, BsFillPersonPlusFill, BsPencilFill } from 'react-icons/bs';
import { publish, subscribe } from '../util/event';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { NavLink, Navigate } from 'react-router-dom';
import QuestionModal from '../modals/QuestionModal';
import EditProfileModal from '../modals/EditProfileModal';
import './ProfilePage.css'
import ActivityPost from '../elements/ActivityPost';
import TopicCard from '../elements/TopicCard';

interface ProfilePageState {
  profile: any;
  followers: any[];
  following: any[];
  message: string;
  alert: string;
  question: string;
  navigate: string;
  openEditProfile: boolean;
  openGiftModal: boolean;
  openUserList: boolean;
  userListTitle: string;
  userList: string[];
  posts: any[];
  topics: any[];
  missions: any[];
  loading: boolean;
  loadingMorePosts: boolean;
}

class ProfilePage extends React.Component<{}, ProfilePageState> {
  author = '';
  posLodMore = 0;
  // isActivity = true;
  filterSelected = 0;

  constructor(props: {}) {
    super(props);

    this.state = {
      profile: null,
      followers: [],
      following: [],
      message: '',
      alert: '',
      question: '',
      navigate: '',
      openEditProfile: false,
      openGiftModal: false,
      openUserList: false,
      userListTitle: 'Following',
      userList: [],
      posts: [],
      topics: [],
      missions: [],
      loading: false,
      loadingMorePosts: false
    };

    this.onPopState = this.onPopState.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
    this.openUserList = this.openUserList.bind(this);
    this.onCloseUserList = this.onCloseUserList.bind(this);
    this.openEditProfile = this.openEditProfile.bind(this);
    this.onCloseEditProfile = this.onCloseEditProfile.bind(this);

    subscribe('show-my-profile', () => {
      this.loadProfile(Server.user.getId());
    });

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
    
    // subscribe('on-flow', () => {
    //   this.loadProfile();
    // });
  }

  componentDidMount() {
    // let filter = sessionStorage.getItem('profile-filter');
    // this.isActivity = filter ? JSON.parse(filter) : true;

    this.loadProfile();
    window.addEventListener('popstate', this.onPopState);
    // Server.user.addEventListener('friend-updated', this.onFriendUpdated);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.onPopState);
    // Server.user.removeEventListener('friend-updated', this.onFriendUpdated);
  }

  onPopState(event:any) {
    this.loadProfile();
  }

  onFriendUpdated(event:any) {
    this.forceUpdate();
  }

  async loadProfile(id:string = '') {
    if(id == '')
      id = window.location.pathname.substring(9);

    let response = await Server.public.loadProfileFromId(id);
    if(!response.success) 
      return;

    this.setState({profile: response.profile});
    // this.getFollowersAndFollowing(response.profile);

    this.author = response.profile.id;
    this.getPosts(this.author);
  }

  onQuestionYes() {
    this.setState({question: '', message: 'Sending invite...'});
    setTimeout(async () => {
      this.setState({message: '', alert: `Invite sent!`});
    }, 500);
  }

  onQuestionNo() {
    this.setState({question: ''});
  }

  async openUserList(mode:string) {
    let userIds = [];
    
    let follows = (mode == 'following') ? this.state.following : this.state.followers;
    for(let i = 0; i < follows.length; i++)
      userIds.push(follows[i]);

    if(userIds.length == 0)
      return;

    if(mode == 'following')
      this.setState({openUserList: true, userListTitle: 'Following', userList: []});
    else
      this.setState({openUserList: true, userListTitle: 'Followers', userList: []});

    await Server.public.loadProfiles(userIds);

    this.setState({userList: userIds});
  }

  onCloseUserList(slug:string) {
    this.setState({openUserList: false});
    if(slug) 
      this.loadProfile(slug);
  }

  openEditProfile() {
    this.setState({openEditProfile: true});
  }

  onCloseEditProfile(slug:string) {
    this.setState({openEditProfile: false});
    if(slug) 
      window.location.assign('/profile/' + slug);
    else
      this.loadProfile();
  }

  renderActionButtons() {
    if(!Server.account.isLoggedIn())
      return (<div className="profile-page-button-container" style={{height: '42px'}}></div>);

    if(this.state.profile.id == Server.user.getId()) {
      return (
        <div className="profile-page-button-container">
          <div onClick={this.openEditProfile} className="profile-page-action-button">
            <BsPencilFill />
          </div>
        </div>      
      )
    }
    else
      return (<div className="profile-page-button-container" style={{height: '42px'}}></div>);

    // let isFriend = Server.user.isFriend(this.state.profile.id);
    // let isFollowing = Server.user.isFollowing(this.state.profile.id);

    // return (
    //   <div className="profile-page-button-container">
    //     {isFriend &&
    //       <div className="profile-page-action-button" onClick={this.onSendMessage}><BsChatDotsFill/></div>
    //     }

    //     {isFriend &&
    //       <div className="profile-page-action-button" onClick={()=>this.openGiftModal()}><BsGiftFill/></div>
    //     }

    //     {!isFriend && 
    //       <div className="profile-page-action-button" onClick={() => this.onInvite()}><BsFillPersonPlusFill/></div>
    //     }

    //     {!isFriend && !isFollowing && 
    //       <div className="profile-page-action-button" onClick={() => this.onFollow()}><BsFillEyeFill/></div>
    //     }

    //     {!isFriend && isFollowing && 
    //       <div className="profile-page-action-button" onClick={() => this.onFollow()}><BsFillEyeSlashFill/></div>
    //     }
    //   </div>
    // )
  }

  onLoadMore() {
    // let data  = this.isActivity ? this.state.posts : this.state.missions;
    // let index = data.length - 1;
    // let id    = data[index].id;
    // let date  = data[index].date;

    // let params = {
    //   author: this.author,
    //   before: {date, id}
    // }

    // if (this.isActivity) 
    //   this.getPosts(params);
    // else 
    //   this.getMissions(params);

    // let div = document.getElementById('id-app-page');
    // this.posLodMore = div.scrollTop;
    // this.setState({ loadingMorePosts: true })
  }

  renderLoadMoreButton() {
    return (
      <div style={{marginTop: '15px'}}>
        <button 
          onClick={()=>this.onLoadMore()} 
          disabled={this.state.loadingMorePosts ? true : false}
        >
          {this.state.loadingMorePosts ? 'Loading...' : 'Load More'}
        </button>
      </div>
    )
  }

  async getPosts(author: string) {
    let posts = Server.public.getPostsOfAuthorFromCache(author);
    if (posts) {
      this.setState({ posts });
      return;
    }

    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let response = await Server.activity.getPostsOfAuthor(author);
    if (!response.success) return;

    posts = response.posts;
    if (this.state.loadingMorePosts)
      posts = this.state.posts.concat(posts);

    this.setState({posts, loading: false, loadingMorePosts: false});

    setTimeout(() => {
      let div = document.getElementById('id-app-page');
      div.scrollTo(0, this.posLodMore);
    }, 10);
  }

  renderPosts() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++)
      divs.push(<ActivityPost key={i} data={this.state.posts[i]} />);

    return divs.length > 0 ? divs : <div>No posts yet.</div>
  }

  async getTopics(author: string) {
    let topics = Server.public.getTopicsOfAuthorFromCache(author);
    if (topics) {
      this.setState({ topics });
      return;
    }

    if (this.state.topics.length == 0)
      this.setState({loading: true});

    let response = await Server.topic.getTopicsOfAuthor(author);
    if (!response.success) return;

    topics = response.topics;
    this.setState({ topics, loading: false });
  }
  
  renderTopics() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = 0; i < this.state.topics.length; i++)
      divs.push(<TopicCard key={i} data={this.state.topics[i]}/>)

    return divs.length > 0 ? divs : <div>No topics yet.</div>
  }

  async getMissions(author: string) {
    let missions = Server.public.getMissionsOfAuthorFromCache(author);
    if (missions) {
      this.setState({ missions });
      return;
    }

    if (this.state.missions.length == 0)
      this.setState({loading: true});

    let response = await Server.topic.getMissionsOfAuthor(author);
    if (!response.success) return;

    missions = response.missions;
    if (this.state.loadingMorePosts)
      missions = this.state.missions.concat(missions);

    this.setState({missions, loading: false, loadingMorePosts: false});

    setTimeout(() => {
      let div = document.getElementById('id-app-page');
      div.scrollTo(0, this.posLodMore);
    }, 10);
  }

  renderMissions() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = 0; i < this.state.missions.length; i++)
      divs.push(<ActivityPost key={i} data={this.state.missions[i]} isMission={true} />);

    return divs.length > 0 ? divs : <div>No missions yet.</div>
  }
  
  onFilter(index: number) {
    if (this.filterSelected === index) return;
    
    // sessionStorage.setItem('profile-filter', this.isActivity.toString());
    this.filterSelected = index;
    this.renderFilters();

    if (index === 0) { // Activity
      this.setState({posts: []});
      setTimeout(() => {
        this.getPosts(this.author);
      }, 10);
    }
    else if (index === 1) { // Topics
      this.setState({topics: []});
      setTimeout(() => {
        this.getTopics(this.author);
      }, 10);
    }
    else { // Missions
      this.setState({missions: []});
      setTimeout(() => {
        this.getMissions(this.author);
      }, 10);
    }
  }

  renderFilters() {
    let filters = ['Activity', 'Topics', 'Missions'];

    let divs = [];
    for (let i = 0; i < filters.length; i++) {
      divs.push(
        <div
          className={`mission-page-filter ${this.filterSelected == i ? 'selected' : ''}`}
          onClick={() => this.onFilter(i)} key={i}
        >
          {filters[i]}
        </div>
      );
    }

    return divs;
  }

  render() {
    if(this.state.navigate != '') 
      return <Navigate to={this.state.navigate} />;

    if (this.state.profile == null) {
      return (
        <div className='profile-page'>
          <div className='profile-page-loading'>Loading...</div>
        </div>
      )
    }
      
    let joined = new Date(Number(this.state.profile.created_at)).toLocaleString();

    let isFriend = false;
    let isCurrent = false;
    let friendOnline = false;

    if (Server.account.isLoggedIn()) {
      // isFriend    = Server.user.isFriend(this.state.profile.id);
      // isCurrent   = Server.user.isCurrent(this.state.profile.id);
      // let friend = Server.user.getFriend(this.state.profile.id);
      // friendOnline = friend && friend.presence && friend.presence.online;
    }
    
    let bannerImage = getBannerImage(this.state.profile);
    let portraitImage = getPortraitImage(this.state.profile);

    let id = this.state.profile.id;
    let shortId = id.substring(0, 6) + '...' + id.substring(id.length - 4);

    return (
      <div className='profile-page'>
        <div className='profile-page-container'>
          <div className='profile-page-header'>
            <img className="profile-page-banner" src={bannerImage} />
            <img className="profile-page-portrait" src={portraitImage} />

            {friendOnline &&
              <div className="profile-page-user-online" />
            }
          </div>

          {this.renderActionButtons()}

          <div className="profile-page-name">{this.state.profile.name}</div>
          <div className="profile-page-id">{shortId}</div>
          <div className="profile-page-desc">{this.state.profile.bio}</div>
          <div className='profile-page-joined-container'>
            <BsCalendarWeek color='white'/>
            <div className='profile-page-joined'>Joined {joined}</div>
          </div>

          { (isFriend || isCurrent) && 
            <div className='profile-page-follow-container'>
              <div className="profile-page-follow-link" onClick={() => this.openUserList('following')}>
                {this.state.following.length} Following
              </div>
              <div className="profile-page-follow-link" onClick={() => this.openUserList('followers')}>
                {this.state.followers.length} Followers
              </div>
            </div>
          }

          <div className='profile-page-social-container'>
            <div className='profile-page-social-header'>
              <div style={{display: 'flex'}}>{this.renderFilters()}</div>

              {/* {this.isActivity 
                ? <NavLink className='profile-page-navlink' to='/activity'>All Posts</NavLink>
                : <NavLink className='profile-page-navlink' to='/missions'>All Missions</NavLink>
              } */}
            </div>

            {this.filterSelected === 0
              ? <div className='profile-page-posts'>{this.renderPosts()}</div>
              : this.filterSelected === 1
                ? <div className='profile-page-posts'>{this.renderTopics()}</div>
                : <div className='profile-page-posts'>{this.renderMissions()}</div>
            }

            {/* {!this.state.loading && this.filterSelected === 0
              ? this.state.posts.length > 0 && this.renderLoadMoreButton()
              : this.state.missions.length > 0 && this.renderLoadMoreButton()
            } */}
          </div>
        </div>

        <EditProfileModal open={this.state.openEditProfile} onClose={this.onCloseEditProfile} />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.setState({alert: ''})}/>
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    );
  }
}

export default ProfilePage;