import React from 'react';
import { Server } from '../../server/server';
import './MissionPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsFillArrowLeftCircleFill } from 'react-icons/bs';
import { checkContent } from './ActivityPage';
import { POSTS_SHEET_ID, REPLIES_SHEET_ID } from '../util/consts';
import MissionPanel from '../elements/MissionPanel';

const category = new Map([[0, 'Videos'], [1, 'Articles'], [2, 'Games']]);

interface MissionPageState {
  mission: any;
  resources: any;
  message: string;
  alert: string;
  loading: boolean;
  openEditor: boolean;
}

class MissionPage extends React.Component<{}, MissionPageState> {

  quillRef: any;
  wordCount = 0;
  missionCid: string;
  filterSelected = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      mission: '',
      resources: [],
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
    this.missionCid = window.location.pathname.substring(9);
    let mission     = Server.public.getMissionFromCache(this.missionCid);

    if (!mission || noCache) {
      let response = await Server.plans.getMission(this.missionCid);
      if (!response.success) return;
      mission = response.mission;
    }

    console.log("mission:", mission)
    this.setState({ mission, loading: false });
    this.getResources(category.get(this.filterSelected));
  }

  async getResources(category: string) {
    if (this.state.resources.length == 0)
      this.setState({loading: true});

    let response = await Server.plans.getResources(category);
    if (!response.success) return;

    let resources = response.resources;
    // Server.public.addRepliesToCache(this.missionCid, resources);
    console.log("resources:", resources)

    this.setState({resources, loading: false});
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

    let response = await Server.activity.createReply(this.missionCid, params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: ''});
      this.getMission(true);
    }
    else
      this.setState({message: '', alert: response.message})
  }

  onAlertClose() {
    this.setState({alert: ''});
  }

  renderReplies() {
    let divs = [];
    let replies = this.state.resources;
    
    for (let i = 0; i < replies.length; i++)
      divs.push(<ActivityPost key={i} data={replies[i]} isReply={true} />)

    return divs;
  }
  
  onBack() {
    window.history.back();
  }

  onFilter(index: number) {
    this.filterSelected = index;
    this.renderFilters();
    this.setState({resources: [], openEditor: false});
    setTimeout(() => {
      this.getResources(category.get(index));
    }, 10);
  }

  renderFilters() {
    let filters = ['Videos', 'Articles', 'Games'];

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
      missionCID: this.missionCid,
      category: category.get(this.filterSelected),
      content: encodeURIComponent(html)
    };

    let response = await Server.plans.createResource(params);

    if (response.success) {
      this.quillRef.setText('');
      this.setState({message: ''});
      this.getResources(category.get(this.filterSelected));
    }
    else
      this.setState({message: '', alert: response.message})
  }

  renderResources() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = 0; i < this.state.resources.length; i++)
      divs.push(<MissionPanel key={i} data={this.state.resources[i]} isResource={true} />);

    return divs.length > 0 ? divs : <div>No resources yet.</div>
  }

  render() {
    return (
      <div className="mission-page">
        <div className="mission-page-header">
          <div className="mission-page-back-button" onClick={()=>this.onBack()}><BsFillArrowLeftCircleFill/></div>
          {!this.state.mission ? 'Loading...' : 'Mission'}
        </div>

        {this.state.mission &&
          <MissionPanel data={this.state.mission} />
        }

        {this.state.mission && 
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
              placeholder = 'Whats new learning resources?'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='mission-page-actions'>
              <button onClick={()=>this.onPost()}>Post</button>
            </div>
          </div>
        }

        {this.state.mission && this.renderResources()}

        {/* {!this.state.loading &&
          <div className="mission-page-reply-container">
            <SharedQuillEditor 
              placeholder='Enter reply...'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref} 
            />

            <div className='mission-page-action'>
              <button onClick={()=>this.onReply()}>Post</button>
            </div>
          </div>
        } */}

        {/* {!this.state.loading && 
          <div className='mission-page-reply-header'>
            {this.state.replies.length} Replies
          </div>
        } */}

        {/* {!this.state.loading && 
          this.renderReplies()
        } */}

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()} />
      </div>
    );
  }
}

export default MissionPage;