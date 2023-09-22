import React from 'react';
import { BsChat, BsChatSquareText, BsCoin } from 'react-icons/bs';
import { capitalizeFirstLetter, convertHashTag, convertUrls, getPortraitImage, numberWithCommas } from '../util/util';
import { Server } from '../../server/server';
import { formatTimestamp } from '../util/util';
import './ActivityPost.css';
import parse, { attributesToProps } from 'html-react-parser';
import { NavLink, Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';

interface ActivityPostProps {
  data: any;
  afterRepost?: Function;
  beforeJump?: Function;
  isReply?: boolean;
  isPostPage?: boolean;
  isMission?: boolean;
  isMissionPage?: boolean;
}

interface ActivityPostState {
  openImage: boolean;
  navigate: string;
  content: string;
}

class ActivityPost extends React.Component<ActivityPostProps, ActivityPostState> {

  id: string;
  imgUrl: string;
  loading: boolean = false;

  parseOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.name === 'img') {
        const props = attributesToProps(domNode.attribs);
        return <img className='ql-editor-image' onClick={(e)=>this.tapImage(e, props.src)} {...props} />;
      }
    }
  };

  constructor(props: ActivityPostProps) {
    super(props);
    let data  = this.props.data;
    this.id  = data.id;

    this.state = {
      openImage: false,
      navigate: '',
      content: Server.public.getPostContentFromCache(this.props.data.id),
    };

    this.onClose = this.onClose.bind(this);
  }

  componentDidMount() {
    this.getPostContent();

    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
  }
  
  componentWillUnmount() {
    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].removeEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
  }

  async getPostContent() {
    let content = this.state.content;
    if (!content) {
      content = await Server.public.downloadFromArweave(this.props.data.url);
      Server.public.addPostContentToCache(this.props.data.id, content);
    }

    this.setState({ content });
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({openImage: true})
  }

  async onCoins(e: any) {
    e.stopPropagation();
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    if (window.location.pathname.indexOf('/profile/') == 0)
      return;

    this.setState({navigate: '/profile/' + id});
  }

  onJump(id: string) {
    if (this.props.isMission)
      this.goMissionPage(id);
    else
      this.goPostPage(id);
  }

  goPostPage(id: string) {
    if (window.location.pathname.indexOf('/activity/post/') == 0)
      return;

    this.setState({navigate: "/activity/post/" + id});

    if (this.props.beforeJump)
      this.props.beforeJump();
  }

  goMissionPage(id: string) {
    if (window.location.pathname.indexOf('/mission/') == 0)
      return;

    this.setState({navigate: "/mission/" + id});

    if (this.props.beforeJump)
      this.props.beforeJump();
  }

  onClose() {
    this.setState({openImage: false});
  }

  renderActionsRow(data: any) {
    let value = Number(data.replies);
    if (this.props.isMission) {
      value = Number(data.doing) + Number(data.learning);
    }

    return (
      <div className='activity-post-action-row'>
        {!this.props.isReply &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              {this.props.isMission ? <BsChatSquareText /> : <BsChat />}
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(value)}
            </div>
          </div>
        }

        <div className='activity-post-action' onClick={(e)=>this.onCoins(e)}>
          <div className='activity-post-action-icon'>
            <BsCoin />
          </div>
          <div className='activity-post-action-number'>
            {numberWithCommas(Number(data.coins))}
          </div>
        </div>

        {this.props.isMission &&
          <div className='activity-post-action'>
            <img style={{width:'20px', height:'20px', marginRight: '5px'}} src='/coin.png' />
            <div className='activity-post-action-number'>
              {numberWithCommas(Number(data.award))}
            </div>
          </div>
        }

        {this.props.isMission &&
          <div className='activity-post-action'>
            <img style={{width:'22px', height:'22px', marginRight: '5px'}} src='/icon/plant.png' />
            <div className='activity-post-action-number'>
              {capitalizeFirstLetter(data.dream)}
            </div>
          </div>
        }
      </div>
    )
  }

  render() {
    let data    = this.props.data;
    let author  = Server.public.getProfile(data.author);
    let date    = formatTimestamp(data.block_timestamp, true);
    // let content = convertHashTag(data.content);
    // content     = convertUrls(content);
    let topic   = Server.public.getTopicFromCache(data.topic_id);
    let mission = Server.public.getMissionFromCache(data.mission_id);
    let path    = window.location.pathname.substring(1, 6);

    if (this.state.navigate) 
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        style={{cursor: this.state.openImage || this.props.isReply 
          || this.props.isPostPage || this.props.isMissionPage ? 'auto' : 'pointer'}}
        onClick={()=>this.onJump(data.id)}
      >
        <div className='activity-post-row-header'>
          {date}
          
          {topic && path !== 'topic' &&
            <NavLink className='activity-post-hashtag' to={'/topic/' + topic.id}>
              <img className='activity-post-topic-image' src={topic.image} />
              <div>{topic.title}</div>
            </NavLink>
          }

          {mission && path !== 'missi' &&
            <NavLink className='activity-post-hashtag' to={'/mission/' + mission.id}>
              <img className='activity-post-topic-image' src='/icon/plant.png' />
              <div>{capitalizeFirstLetter(mission.dream)}</div>
            </NavLink>
          }
        </div>

        <div className="activity-post-row">
          <div className='activity-post-profile'>
            <img 
              className="activity-post-portrait clickable" 
              src={getPortraitImage(author)} 
              onClick={(e)=>this.goProfilePage(e, author.id)} 
            />

            <div className="activity-post-author clickable" onClick={(e)=>this.goProfilePage(e, author.id)}>
              {author.id == Server.user.getId() ? 'You' : author.name}
            </div>
          </div>

          {/* <div>{parse(content, this.parseOptions)}</div> */}
          {this.state.content
            ? <div>{parse(this.state.content, this.parseOptions)}</div>
            : <div>Loading...</div>
          }
          
          {this.renderActionsRow(data)}
        </div>

        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default ActivityPost;