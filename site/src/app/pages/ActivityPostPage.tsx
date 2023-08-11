import React from 'react';
import { Server } from '../../server/server';
import './ActivityPostPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsFillArrowLeftCircleFill } from 'react-icons/bs';
import { checkContent } from './ActivityPage';
import { POSTS_SHEET_ID, REPLIES_SHEET_ID } from '../util/consts';
import { subscribe } from '../util/event';

interface ActivityPostPageState {
  post: any;
  replies: any;
  message: string;
  alert: string;
  loading: boolean;
}

class ActivityPostPage extends React.Component<{}, ActivityPostPageState> {

  quillRef: any;
  wordCount = 0;
  postCid: string;

  constructor(props: {}) {
    super(props);
    this.state = {
      post: '',
      replies: '',
      message: '',
      alert: '',
      loading: true,
    };

    this.onContentChange = this.onContentChange.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  componentDidMount() {
    document.getElementById('id-app-page').scrollTo(0, 0);
    this.getPost();
  }

  async getPost(noCache?: boolean) {
    this.postCid = window.location.pathname.substring(15);
    let post     = Server.public.getPostFromCache(this.postCid);

    if (!post || noCache) {
      let response = await Server.activity.getPost(this.postCid);
      if (!response.success) return;
      post = response.post;
      if (post.author)
        await Server.public.loadProfileFromId(post.author);
    }

    console.log("post:", post)
    this.setState({ post, loading: false });
    
    // get replies
    let replies = Server.public.getRepliesFromCache(this.postCid);
    if (!replies) {
      let response = await Server.activity.getReplies(this.postCid);
      if (!response.success) return;

      replies = response.replies;
      Server.public.addRepliesToCache(this.postCid, replies);

      // cache profiles
      let profiles = [];
      for (let i = 0; i < replies.length; i++) {
        if (profiles.indexOf(replies[i].author) == -1 && replies[i].author)
          profiles.push(replies[i].author);
      }

      await Server.public.loadProfiles(profiles);
    }
    console.log("replies:", replies)

    this.setState({replies});
  }

  async onReply() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    this.setState({message: 'Replying...'});

    let html   = this.quillRef.root.innerHTML;
    let params = {
      author: Server.user.getId(), 
      content: encodeURIComponent(html)
    };

    let response = await Server.activity.createReply(this.postCid, params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: ''});
      this.getPost(true);
    }
    else
      this.setState({message: '', alert: response.message})
  }

  onAlertClose() {
    this.setState({alert: ''});
  }

  renderReplies() {
    let divs = [];
    let replies = this.state.replies;
    
    for (let i = 0; i < replies.length; i++)
      divs.push(<ActivityPost key={i} data={replies[i]} isReply={true} />)

    return divs;
  }
  
  onBack() {
    window.history.back();
  }

  render() {
    return (
      <div className="activity-post-page">
        <div className="activity-post-page-header">
          <div className="activity-post-page-back-button" onClick={()=>this.onBack()}><BsFillArrowLeftCircleFill/></div>
          {this.state.loading ? 'Loading...' : 'Post'}
        </div>

        {!this.state.loading && 
          <ActivityPost data={this.state.post} isPostPage={true} />
        }

        {!this.state.loading && Server.account.isLoggedIn() &&
          <div className="activity-post-page-reply-container">
            <SharedQuillEditor 
              placeholder='Enter reply...'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref} 
            />

            <div className='activity-post-page-action'>
              <button onClick={()=>this.onReply()}>Post</button>
            </div>
          </div>
        }

        {!this.state.loading && 
          <div className='activity-post-page-reply-header'>
            {this.state.replies.length} Replies
          </div>
        }

        {!this.state.loading && 
          this.renderReplies()
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()} />
      </div>
    );
  }
}

export default ActivityPostPage;