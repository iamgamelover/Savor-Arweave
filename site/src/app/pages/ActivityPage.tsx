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
import { BsEye } from 'react-icons/bs';

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
  range: string;
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
      range: 'everyone',
      loading: false
    };

    this.onRangeChange = this.onRangeChange.bind(this);
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

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({range: element.value});
  }

  onCategoryChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({category: element.value, posts: []});
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

  async getPosts(category: string) {
    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let response;
    if (category === 'private')
      response = await Server.activity.getPostsOfAuthor(Server.user.getId());
    else
      response = await Server.activity.getPosts();

    if (!response.success) return;

    let posts = response.posts;
    this.setState({ posts, loading: false });
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
      range: this.state.range,
      content: encodeURIComponent(html)
    };

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

    // this.getPosts(params);
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
              <select
                className="activity-page-filter post" 
                value={this.state.range} 
                onChange={this.onRangeChange}
              >
                <option value="everyone">Everyone</option>
                {/* <option value="following">Following</option> */}
                <option value="private">Private</option>
              </select>

              <button onClick={()=>this.onPost()}>Post</button>
            </div>
          </div>
        }

        {/* <select
          className="activity-page-filter" 
          value={this.state.category} 
          onChange={this.onCategoryChange}
        >
          <option value="community">Community</option>
          <option value="following">Following</option>
          <option value="private">My Posts</option>
        </select> */}

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