import React from 'react';
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import { formatTimestamp, getBannerImage, getPortraitImage, numberWithCommas, uuid } from '../util/util';
import './HomePage.css';
import { subscribe } from '../util/event';
import ActivityPost from '../elements/ActivityPost';

interface HomePageState {
  balance: string;
  posts: any[];
  missions: any[];
  loading: boolean;
  todayTopic: any;
}

class HomePage extends React.Component<{}, HomePageState> {
  filterSelected = 0;

  constructor(props:{}) {
    super(props);
    this.state = {
      balance: '',
      posts: [],
      missions: [],
      loading: false,
      todayTopic: ''
    }

    subscribe('wallet-events', () => {
      // this.getBalance();
      this.forceUpdate();
    });
  }

  componentDidMount() {
    // window.scrollTo(0, 0);
    // this.getBalance();
    // this.getPlanOfTheDay();

    // if (this.filterSelected == 0)
    //   this.getHotPosts();
    // else
    //   this.getHotMissions();
  }

  getTopicOfTheDay() {
    let topics = Server.public.getTopicsFromCache();

    for (let i = 0; i < topics.length; i++) {
      if (topics[i].today === '1') {
        this.setState({ todayTopic: topics[i] });
        break;
      }
    }
  }

  async getBalance() {
    // const balance = await Server.user.getBalanceOfLAC(Server.account.getWallet());
    // console.log("TestLAC balance:", balance)
    // this.setState({balance});
  }

  renderData() {
    return (
      <div className="home-page-data-container">
        <div className="home-page-data-row">
          <div>Balance</div>
          <div style={{textAlign: 'right', marginRight: '8px'}}>{numberWithCommas(Number(this.state.balance))}</div>
          <img style={{width:'26px'}} src='/coin.png' />
        </div>

        <div className="home-page-data-row">
          <div>Reward in 7 Days</div>
          <div style={{textAlign: 'right', marginRight: '8px'}}>0</div>
          <img style={{width:'26px'}} src='/coin.png' />
        </div>
      </div>
    )
  }

  onFilter(index: number) {
    if (this.filterSelected === index) return;
    
    this.filterSelected = index;

    if (this.filterSelected == 0) {
      this.setState({posts: []});
      setTimeout(() => {
        this.getHotPosts();
      }, 10);
    }
    else {
      this.setState({missions: []});
      setTimeout(() => {
        this.getHotMissions();
      }, 10);
    }
  }

  renderFilters() {
    let filters = ['Hot Posts', 'Hot Missions'];

    let divs = [];
    for (let i = 0; i < filters.length; i++) {
      divs.push(
        <div
          className={`home-page-filter ${this.filterSelected == i ? 'selected' : ''}`}
          onClick={() => this.onFilter(i)} key={i}
        >
          {filters[i]}
        </div>
      );
    }

    return divs;
  }

  async getHotPosts() {
    // if (this.state.posts.length == 0)
    //   this.setState({loading: true});

    // let response = await Server.activity.getPosts();
    // if (!response.success) return;

    // let posts = response.posts;
    // posts = posts.filter((item) => {
    //   return item.likes > 0;
    // });

    // // cache profiles
    // let profiles = [];
    // for (let i = 0; i < posts.length; i++) {
    //   if (posts[i].author && profiles.indexOf(posts[i].author) == -1)
    //     profiles.push(posts[i].author);
    // }

    // await Server.public.loadProfiles(profiles);

    // console.log("hot posts:", posts)
    // this.setState({posts, loading: false});
  }

  renderPosts() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs   = [];
    let length = this.state.posts.length > 10 ? 10 : this.state.posts.length;

    for (let i = 0; i < length; i++)
      divs.push(<ActivityPost key={i} data={this.state.posts[i]} />);

    return divs.length > 0 ? divs : <div>No hot posts yet.</div>
  }

  async getHotMissions() {
  }

  renderMissions() {
    return (<div>No hot missions yet.</div>)
  }
  
  renderTodayTopic() {
    let data = this.state.todayTopic;
    if (!data) return (<div></div>);
    
    return (
      <NavLink className='topic-card home-page-topic-margin' to={'/topic/' + data.id}>
        <div className='topic-card-image-container'>
          <img className='topic-card-image' src={data.image} />
        </div>
        <div>
          <div className='topic-card-header'>
            <div className='topic-card-publisher'>{data.publisher}</div>
            <div className='topic-card-summary'>·</div>
            <div className='topic-card-summary'>{formatTimestamp(data.date, true)}</div>
          </div>
          <div className='topic-card-title'>{data.title}</div>
          <div className='topic-card-summary'>{data.summary}</div>
        </div>
      </NavLink>
    )
  }

  render() {
    let profile  = Server.user.getProfile();
    let banner   = getBannerImage(profile);
    let portrait = getPortraitImage(profile);

    let profileUrl;
    if (profile)
      profileUrl = '/profile/' + profile.id;

    return (
      <div className="home-page">
        <div className="home-page-container">
          {Server.account.isLoggedIn() &&
            <div className="home-page-header">
              <img className="home-page-banner" src={banner} />
              <img className="home-page-portrait" src={portrait} />
            </div>
          }

          {Server.account.isLoggedIn() &&
            <div className="home-page-action-container">
              <NavLink to={profileUrl}><button>Profile</button></NavLink>
            </div>
          }

          {Server.account.isLoggedIn() && this.renderData()}

          <div className='home-page-topic-container'>
            <div className='home-page-filter-container'>
              <div className='home-page-topic-title'>TOPIC OF THE DAY</div>
            </div>

            {this.renderTodayTopic()}

            <div className='home-page-filter-container'>
              <div className='home-page-topic-title'>Dreams On The Way</div>
            </div>

            <div className='home-page-dreams-container'>
              <div className='home-page-dreams-row'>
                <div>Astronaut</div>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{marginRight: '6px'}}>{numberWithCommas(0)}</div>
                  <img style={{width:'25px'}} src='/portrait-default.png' />
                </div>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{marginRight: '6px'}}>{numberWithCommas(0)}</div>
                  <img style={{width:'25px'}} src='/coin.png' />
                </div>
              </div>

              <div className='home-page-dreams-row'>
                <div>Chef</div>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{marginRight: '6px'}}>{numberWithCommas(0)}</div>
                  <img style={{width:'25px'}} src='/portrait-default.png' />
                </div>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{marginRight: '6px'}}>{numberWithCommas(0)}</div>
                  <img style={{width:'25px'}} src='/coin.png' />
                </div>
              </div>

              <div className='home-page-dreams-row'>
                <div>Doctor</div>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{marginRight: '6px'}}>{numberWithCommas(0)}</div>
                  <img style={{width:'25px'}} src='/portrait-default.png' />
                </div>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                  <div style={{marginRight: '6px'}}>{numberWithCommas(0)}</div>
                  <img style={{width:'25px'}} src='/coin.png' />
                </div>
              </div>
            </div>
          </div>

          <div className='home-page-filter-container'>
            <div style={{display: 'flex'}}>
              {this.renderFilters()}
            </div>

            {this.filterSelected == 0 
              ? <NavLink className='home-page-navlink' to='/activity'>All Posts</NavLink>
              : <NavLink className='home-page-navlink' to='/missions'>All Missions</NavLink>
            }
          </div>

          {this.filterSelected == 0
            ? <div className='home-page-posts'>{this.renderPosts()}</div>
            : <div className='home-page-posts'>{this.renderMissions()}</div>
          }
        </div>
      </div>
    );
  }
}

export default HomePage;