import React from 'react';
import { Server } from '../../server/server';
import './ActivityPage.css'
import 'react-quill/dist/quill.snow.css';
import { getMediaAmount } from '../util/util';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { subscribe } from '../util/event';
import { TIPS_ARWEAVE } from '../util/consts';

export function checkContent(quillRef: any, wordCount: number) {
  // console.log('wordCount', wordCount)
  let message = '';
  let mediaAmount = getMediaAmount(quillRef);
  if (mediaAmount > 1)
    return 'Only one media is allowed.';

  if (wordCount == 0 && mediaAmount == 0)
    message = 'Content is empty.';
  else if (wordCount > 500)
    message = 'Content must be at most 500 characters.';

  return message;
}

interface ActivityPageState {
  posts: any;
  message: string;
  alert: string;
  category: string;
  loading: boolean;
}

class ActivityPage extends React.Component<{}, ActivityPageState> {

  quillRef: any;
  wordCount = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      posts: '',
      message: '',
      alert: '',
      category: 'community',
      loading: false
    };

    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.afterRepost = this.afterRepost.bind(this);
    this.beforeJump = this.beforeJump.bind(this);
    
    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  onCategoryChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({category: element.value});
    this.getPosts(element.value);
  }

  componentDidMount() {
    let posts    = Server.public.getPostsFromCache();
    let position = Server.public.getPositionFromCache();

    if (posts) {
      this.setState({posts});
      setTimeout(() => {
        let div = document.getElementById('id-app-page');
        div.scrollTo(0, position);
      }, 10);
    }
    else
      this.getPosts(this.state.category);
  }

  componentWillUnmount(): void {
    let div = document.getElementById('id-app-page');
    Server.public.addPositionToCache(div.scrollTop);
  }

  async getPosts(params: any) {
    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let response = await Server.activity.getPosts();
    if (!response.success) return;

    // cache profiles
    let profiles = [];
    let posts = response.posts;

    for (let i = 0; i < posts.length; i++) {
      if (posts[i].author && profiles.indexOf(posts[i].author) == -1)
        profiles.push(posts[i].author);
    }

    await Server.public.loadProfiles(profiles);

    this.setState({ posts, loading: false });
    Server.public.addPostsToCache(posts);
  }

  async onPost() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    this.setState({message: 'Posting...'});

    let html   = this.quillRef.root.innerHTML;
    let params = {content: encodeURIComponent(html)};

    let response = await Server.activity.createPost(params);

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

  renderPosts() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++)
      divs.push(
        <ActivityPost 
          key={i} 
          data={this.state.posts[i]} 
          afterRepost={this.afterRepost} 
          beforeJump={this.beforeJump} 
        />
      )

    return divs.length > 0 ? divs : <div>No posts yet.</div>
  }

  beforeJump() {
    let div = document.getElementById('id-app-page');
    Server.public.addPositionToCache(div.scrollTop);
    // Server.public.addPostsToCache(this.state.posts);
  }

  onLoadMore() {
    let posts  = this.state.posts;
    let index  = posts.length - 1;
    let author = posts[index].author;
    let date   = posts[index].date;

    let params = {
      filter: this.state.category,
      before: {date: date, author: author}
    }

    this.getPosts(params);
  }

  afterRepost() {
    if (this.state.category == 'community')
      this.getPosts('community');
  }

  render() {
    return (
      <div className="activity-page">
        {Server.account.isLoggedIn() &&
          <div className="activity-page-input-container">
            <SharedQuillEditor 
              placeholder = 'Whats happening?'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='activity-page-actions'>
              <button onClick={()=>this.onPost()}>Post</button>
            </div>
          </div>
        }

        {/* <div style={{textAlign: 'left', marginTop: '10px'}}>
          <select
            className="activity-page-filter" 
            value={this.state.category} 
            onChange={this.onCategoryChange}
          >
            <option value="community">Community</option>
            <option value="friends">Friends</option>
            <option value="following">Following</option>
            <option value="user">My Posts</option>
          </select>
        </div> */}

        {this.renderPosts()}

        {this.state.posts.length != 0 &&
          <div><button onClick={()=>this.onLoadMore()}>Load More</button></div>
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()}/>
      </div>
    );
  }
}

export default ActivityPage;