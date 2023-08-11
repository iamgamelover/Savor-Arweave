import React from 'react';
import { BsChat, BsHeart, BsHeartFill } from 'react-icons/bs';
import { convertHashTag, convertSlug, convertUrls, getPortraitImage, numberWithCommas } from '../util/util';
import { Server } from '../../server/server';
import { formatTimestamp } from '../util/util';
import './ActivityPost.css';
import parse, { attributesToProps } from 'html-react-parser';
import { Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';

interface ActivityPostProps {
  data: any;
  afterRepost?: Function;
  beforeJump?: Function;
  isReply?: boolean;
  isPostPage?: boolean;
}

interface ActivityPostState {
  likes: number;
  liked: boolean;
  openImage: boolean;
  navigate: string;
}

class ActivityPost extends React.Component<ActivityPostProps, ActivityPostState> {

  cid: string;
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
    this.cid  = data.cid;

    this.state = {
      likes: data.likes,
      liked: (data.liked.indexOf(Server.user.getId()) != -1),
      openImage: false,
      navigate: ''
    };

    this.onClose = this.onClose.bind(this);
  }

  componentDidMount() {
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

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({openImage: true})
  }

  async onLike(e: any) {
    e.stopPropagation();

    if (this.loading) return;
    this.loading = true;
    let liked = this.state.liked;

    let num = this.state.likes;
    if (liked)
      num -= 1;
    else
      num += 1;

    this.setState({
      likes: num,
      liked: !liked
    })

    let response;
    if (liked)
      response = await Server.activity.likePost(this.cid, false);
    else
      response = await Server.activity.likePost(this.cid, true);

    if (!response.success) {
      num -= 1;
      this.setState({
        likes: num,
        liked: !this.state.liked
      })
    }
    
    this.loading = false;
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    if (window.location.pathname.indexOf('/profile/') == 0)
      return;

    this.setState({navigate: '/profile/' + id});
  }

  goPostPage(id: string) {
    if (window.location.pathname.indexOf('/activity/post/') == 0)
      return;

    this.setState({navigate: "/activity/post/" + id});

    if (this.props.beforeJump)
      this.props.beforeJump();
  }

  onClose() {
    this.setState({openImage: false});
  }

  renderActionsRow(data: any) {
    return (
      <div className='activity-post-action-row'>
        <div className='activity-post-action'>
          <div className='activity-post-action-icon'>
            <BsChat />
          </div>
          <div className='activity-post-action-number'>
            {typeof(data.replies) == 'number' 
              ? numberWithCommas(data.replies)
              : data.replies.length
            }
          </div>
        </div>

        {Server.account.isLoggedIn() &&
          <div className='activity-post-action' onClick={(e)=>this.onLike(e)}>
            <div className='activity-post-action-icon'>
              {this.state.liked 
                ? <BsHeartFill color='red' />
                : <BsHeart />
              }
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(this.state.likes)}
            </div>
          </div>
        }
      </div>
    )
  }

  render() {
    let data    = this.props.data;
    let author  = Server.public.getProfile(data.author);
    let date    = formatTimestamp(data.date, true);
    let content = convertHashTag(data.content);
    content     = convertUrls(content);

    if (this.state.navigate) 
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        style={{cursor: this.state.openImage || this.props.isReply || this.props.isPostPage ? 'auto' : 'pointer'}}
        onClick={()=>this.goPostPage(data.cid)}
      >
        <div className='activity-post-row-header'>{date}</div>
        <div className="activity-post-row">
          {author ?
            <div className='activity-post-profile'>
              <img className="activity-post-portrait clickable" src={getPortraitImage(author)} onClick={(e)=>this.goProfilePage(e, author.id)} />
              <div className="activity-post-author clickable" onClick={(e)=>this.goProfilePage(e, author.id)}>
                {author.id == Server.user.getId() ? 'You' : author.name}
              </div>
            </div> :
            <div className='activity-post-profile'>
              <img className="activity-post-portrait" src={getPortraitImage(author)} />
              <div className="activity-post-author">Anonymous</div>
            </div>
          }

          <div>{parse(content, this.parseOptions)}</div>

          {!this.props.isReply &&
            this.renderActionsRow(data)
          }
        </div>

        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default ActivityPost;