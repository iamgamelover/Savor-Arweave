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
  missions: any[];
  loading: boolean;
  loadingMorePosts: boolean;
}

class ProfilePage extends React.Component<{}, ProfilePageState> {
  author = '';
  posLodMore = 0;
  isActivity = true;

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
    let filter = sessionStorage.getItem('profile-filter');
    this.isActivity = filter ? JSON.parse(filter) : true;

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
    if (this.isActivity)
      this.getPosts(this.author);
    else
      this.getMissions(this.author);
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

  onFilter(filter: boolean) {
    if (this.isActivity == filter)
      return;

    this.isActivity = filter;
    this.posLodMore = 0;

    sessionStorage.setItem('profile-filter', this.isActivity.toString());

    if (this.isActivity) {
      this.setState({posts: []});
      setTimeout(() => {
        this.getPosts(this.author);
      }, 10);
    }
    else {
      this.setState({missions: []});
      setTimeout(() => {
        this.getMissions(this.author);
      }, 10);
    }
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
    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let response = await Server.activity.getPosts();
    if (!response.success) return;

    let posts = response.posts;
    posts = posts.filter((item) => {
      return item.author == author;
    });

    console.log("posts:", posts)

    if (this.state.loadingMorePosts)
      posts = this.state.posts.concat(posts);

    this.setState({posts: posts, loading: false, loadingMorePosts: false});

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

  async getMissions(params: any) {
    // if (this.state.blogs.length == 0)
    //   this.setState({loading: true});

    // let response = await Server.blogs.getBlogs(params);
    // if (!response.success)
    //   return

    // let blogs = response.blogs;
    // if (this.state.loadingMorePosts)
    //   blogs = this.state.blogs.concat(blogs);

    // this.setState({blogs: blogs, loading: false, loadingMorePosts: false});

    // setTimeout(() => {
    //   let div = document.getElementById('id-app-page');
    //   div.scrollTo(0, this.posLodMore);
    // }, 10);
  }

  renderMissions() {
    return (<div>No missions yet.</div>)
    // if (this.state.loading)
    //   return (<div>Loading...</div>);

    // let divs = [];
    // for (let i = 0; i < this.state.blogs.length; i++)
    //   divs.push(<BlogCard key={i} data={this.state.blogs[i]}  onClick={this.onBlogClick} onEdit={this.onBlogEdit} />);

    // return divs.length > 0 ? divs : <div>No blogs yet.</div>
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
      
    let joined = new Date(this.state.profile.date * 1000).toLocaleString();

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
          {/* <div className="profile-page-slug">@{this.state.profile.slug}</div> */}
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
              <div style={{display: 'flex'}}>
                <div className={`profile-page-filter ${this.isActivity ? 'selected' : ''}`} onClick={()=>this.onFilter(true)}>
                  Activity
                </div>
                <div className={`profile-page-filter ${this.isActivity ? '' : 'selected'}`} onClick={()=>this.onFilter(false)}>
                  Missions
                </div>
              </div>

              {this.isActivity 
                ? <NavLink className='profile-page-navlink' to='/activity'>All Posts</NavLink>
                : <NavLink className='profile-page-navlink' to='/missions'>All Missions</NavLink>
              }
            </div>

            {this.isActivity
              ? <div className='profile-page-posts'>{this.renderPosts()}</div>
              : <div className='profile-page-posts'>{this.renderMissions()}</div>
            }

            {!this.state.loading && this.isActivity
              ? this.state.posts.length > 0 && this.renderLoadMoreButton()
              : this.state.missions.length > 0 && this.renderLoadMoreButton()
            }
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