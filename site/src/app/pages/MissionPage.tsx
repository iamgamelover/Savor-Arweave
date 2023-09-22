import React from 'react';
import { Server } from '../../server/server';
import './MissionPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsClock, BsFillArrowLeftCircleFill } from 'react-icons/bs';
import { checkContent } from './ActivityPage';
import { TIPS_ARWEAVE } from '../util/consts';

// const category = new Map([[0, 'Doing'], [1, 'Learning']]);

interface MissionPageState {
  mission: any;
  posts: any;
  message: string;
  alert: string;
  loading: boolean;
  openEditor: boolean;
}

class MissionPage extends React.Component<{}, MissionPageState> {

  quillRef: any;
  wordCount = 0;
  missionId: string;
  filterSelected = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      mission: '',
      posts: [],
      message: '',
      alert: '',
      loading: true,
      openEditor: false,
    };

    this.onContentChange = this.onContentChange.bind(this);
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  componentDidMount() {
    document.getElementById('id-app-page').scrollTo(0, 0);
    this.getMission();
  }

  async getMission(noCache?: boolean) {
    this.missionId = window.location.pathname.substring(9);
    let mission    = Server.public.getMissionFromCache(this.missionId);

    if (!mission || noCache) {
      let response = await Server.topic.getMission(this.missionId);
      if (!response.success) return;
      mission = response.mission;
    }

    // console.log("mission:", mission)
    this.setState({ mission, loading: false });
    this.getPosts(this.filterSelected.toString());
  }

  async getPosts(missionIndex: string) {
    let posts = Server.public.getPostsOfMissionFromCache(missionIndex);
    if (posts) {
      this.setState({ posts });
      return;
    }

    if (this.state.posts.length == 0)
      this.setState({loading: true});

    let response = await Server.activity.getPostsOfMission(this.missionId, missionIndex);
    if (!response.success) return;

    this.setState({posts: response.posts, loading: false});
  }

  onAlertClose() {
    this.setState({alert: ''});
  }

  onBack() {
    window.history.back();
  }

  onFilter(index: number) {
    this.filterSelected = index;
    this.renderFilters();
    this.setState({posts: [], openEditor: false});
    setTimeout(() => {
      this.getPosts(index.toString());
    }, 10);
  }

  renderFilters() {
    let filters = ['Doing', 'Learning'];

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

  async onPost() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    this.setState({message: 'Posting...'});

    let html   = this.quillRef.root.innerHTML;
    let params = {
      missionId: this.missionId,
      missionIndex: this.filterSelected.toString(),
      content: encodeURIComponent(html)
    };

    let response = await Server.activity.createPost(params, true);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: '', alert: TIPS_ARWEAVE});
    }
    else
      this.setState({message: '', alert: response.message})
  }

  renderMissionPosts() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++)
      divs.push(<ActivityPost key={i} data={this.state.posts[i]} />);

    return divs.length > 0 ? divs : <div>No posts yet.</div>
  }

  render() {
    let mission = this.state.mission;
    let date = new Date(Number(mission.block_timestamp * 1000)).toLocaleString();

    let placeholder = this.filterSelected === 0 ? 'Whats new doing?' : 'Whats new learning?';

    return (
      <div className="mission-page">
        <div className="mission-page-header">
          <div className="mission-page-back-button" onClick={()=>this.onBack()}><BsFillArrowLeftCircleFill/></div>
          {!this.state.mission ? 'Loading...' : 'Mission'}
        </div>

        {mission &&
          <ActivityPost data={this.state.mission} isMission={true} isMissionPage={true} />
        }

        {mission &&
          <div className='mission-page-block-time'><BsClock />{date}</div>
        }

        {mission && 
          <div className='mission-page-resource-header'>
            <div style={{display: 'flex'}}>{this.renderFilters()}</div>
            <button onClick={()=>this.setState({openEditor: !this.state.openEditor})}>
              {this.state.openEditor ? 'Cancel' : 'New'}
            </button>
          </div>
        }

        {this.state.openEditor &&
          <div className="mission-page-input-container">
            <SharedQuillEditor 
              placeholder={placeholder}
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='mission-page-actions'>
              <button onClick={()=>this.onPost()}>Post</button>
            </div>
          </div>
        }

        {mission && this.renderMissionPosts()}

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()} />
      </div>
    );
  }
}

export default MissionPage;