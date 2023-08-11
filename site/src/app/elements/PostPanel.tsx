import React from 'react';
import { BsFillXCircleFill, BsThreeDots, BsTrash, BsVectorPen } from 'react-icons/bs';
import { NavLink } from 'react-router-dom';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import QuestionModal from '../modals/QuestionModal';
import { formatTimestamp } from '../util/util';
import './PostPanel.css';

interface PostPanelProps {
  metadata: any;
}

interface PostPanelState {
  question: string;
  message: string;
  alert: string;
  content: string;
  openEditPost: boolean;
}

class PostPanel extends React.Component<PostPanelProps, PostPanelState> {

  constructor(props: PostPanelProps) {
    super(props);
    this.state = {
      question: '',
      message: '',
      alert: '',
      content: this.props.metadata.content,
      openEditPost: false,
    };

    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
  }

  DropdownMenu = () => {
    return (
      <div className="post-panel-menu-panel">
        <div className="post-panel-menu-item" onClick={()=>this.openEditPost()}>
          <BsVectorPen />&nbsp;&nbsp;Edit
        </div>
        <div className="post-panel-menu-item" onClick={()=>this.onDeletePost()}>
          <BsTrash />&nbsp;&nbsp;Delete
        </div>
      </div>
    )
  }

  onDeletePost() {
    this.setState({question: 'Are you sure you want to delete this post?'});
  }

  onQuestionYes() {
    this.setState({question: '', message: 'Deleting...'});

    setTimeout(async () => {
      let params = {
        id: this.props.metadata.id,
      }

      // await Server.forums.deletePost(params);
      this.setState({message: '', alert: 'Deleted!'});
    }, 500);
  }

  onQuestionNo() {
    this.setState({question: ''});
  }

  onSubmit() {
    console.log('onSubmit:', this.state.content);
    this.setState({openEditPost: false, message: 'Submiting...'});

    setTimeout(async () => {
      let params = {
        postId: this.props.metadata.id,
        message: this.state.content
      }

      // await Server.forums.editPost(params);
      this.setState({message: '', alert: 'Submit done!'});
    }, 500);
  }

  openEditPost() {
    this.setState({ openEditPost: true });
  }
  
  onClose() {
    this.setState({ openEditPost: false });
  }

  onContentChange(e: any) {
    this.setState({content: e.currentTarget.value});
  };

  EditPostModal = () => {
    if(!this.state.openEditPost)
      return (<div></div>);

    return (
      <div className="modal open">
        <div className="modal-content">
          <button className="modal-close-button" onClick={()=>this.onClose()}>
            <BsFillXCircleFill />
          </button>
          <div className="edit-post-modal-header">Edit Post</div>
          <textarea
            className="edit-post-modal-textarea"
            value={this.state.content}
            onChange={this.onContentChange}
          />

          <div className="edit-post-modal-button">
            <button onClick={()=>this.onSubmit()}>Submit</button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    let data = this.props.metadata;

    return (
      <div className="post-panel">
        <div>
          <div className='post-panel-time'>{formatTimestamp(data.time)}</div>
          <div className='post-panel-menu-button'>
            <BsThreeDots />
            <this.DropdownMenu />
          </div>
        </div>

        <div style={{display: 'flex'}}>
          <NavLink className="post-panel-profile-link" to={'/profile/' + data.authorSlug}>
            <img className='post-panel-portrait' src={data.portrait} />
            <div className='post-panel-author'>{data.author}</div>
          </NavLink>
          <div className='post-panel-content'>{data.content}</div>
        </div>

        <this.EditPostModal />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.setState({alert: ''})}/>
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    )
  }
}

export default PostPanel;