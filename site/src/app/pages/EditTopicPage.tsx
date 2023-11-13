import React from 'react';
import './EditTopicPage.css'
import { BsFillArrowLeftCircleFill, BsFillXCircleFill, BsPencilFill } from 'react-icons/bs';
import { Navigate } from 'react-router-dom';
import QuestionModal from '../modals/QuestionModal';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import { Server } from '../../server/server';
import BadWords from '../util/badWords';
import { getMediaAmount } from '../util/util';
import { TIPS_ARWEAVE } from '../util/consts';
import { subscribe } from '../util/event';

interface EditTopicPageState {
  title: string;
  publisher: string;
  category: string;
  range: string;
  date: string;
  tags: string;
  wordCount: number;
  goTopicsPage: boolean;
  question: string;
  message: string;
  alert: string;
  editTopic: boolean;
  brandNew: boolean;
}

class EditTopicPage extends React.Component<{}, EditTopicPageState> {

  quillRef: any;
  topic: any = {id: '', state: ''};
  action: string;
  stateChanged: boolean;

  constructor(props: any) {
    super(props);
    this.quillRef = null;
    this.state = {
      title: '',
      publisher: '',
      category: 'normal',
      range: 'everyone',
      date: '',
      tags: '',
      wordCount: 0,
      goTopicsPage: false,
      question: '',
      message: '',
      alert: '',
      editTopic: false,
      brandNew: false,
    }

    this.stateChanged = false;

    this.onPublisherChange = this.onPublisherChange.bind(this);
    this.onTitleChange = this.onTitleChange.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount () {
    let path = window.location.pathname;
    if (path.substring(7) == 'new')
      this.setState({editTopic: false, brandNew: true});
    else
      this.getTopic(path.substring(12));
  }
  
  async getTopic(id: string) {
    // let response = await Server.blogs.getBlog({slug});
    // if (!response.success)
    //   return

    // this.topic = response.topic;
    // this.setState({
    //   title: this.topic.title,
    //   slug: this.topic.slug,
    //   tags: this.topic.tags,
    //   date: this.topic.date
    // });

    // let content = decodeURIComponent(this.topic.content);
    // this.quillRef.root.innerHTML = content;
  }
  
  async getTopicById(id: string) {
    // let response = await Server.blogs.getBlog({id});
    // if (!response.success)
    //   return

    // this.topic = response.topic;
  }

  async onPublish() {
    if (!this.checkTopicContent())
      return;

    this.action = '';

    let summary = this.quillRef.getText().trim();
    if (summary.length > 150)
      summary = summary.substring(0, 150) + '...';

    let content = this.quillRef.root.innerHTML;
    let params = {
      title: this.state.title,
      publisher: this.state.publisher,
      category: this.state.category,
      range: this.state.range,
      summary: summary,
      banner:  '/banner-planets.png', // will be updated
      content: encodeURIComponent(content),
    }

    let paramsEdit;
    if (this.state.editTopic)
      paramsEdit = {...{id: this.topic.id}, ...params}

    this.setState({message: 'Publishing...'});

    let response = null;
    if (this.state.editTopic)
      response = await Server.topic.createTopic(paramsEdit);
    else
      response = await Server.topic.createTopic(params);

    if (response.success) {
      // clear the form
      this.quillRef.setText('');
      this.setState({
        title: '',
        publisher: '',
        category: 'normal',
        range: 'everyone'
      });
  
      // this.setState({message: '', goTopicsPage: true});
      this.setState({message: '', alert: TIPS_ARWEAVE});
    }
    else
      this.setState({message: '', alert: response.message})
  }

  onPublisherChange(e: any) {
    this.setState({publisher: e.currentTarget.value});
  };

  onCategoryChange(e: any) {
    this.setState({category: e.currentTarget.value});
  };

  onRangeChange(e: any) {
    this.setState({range: e.currentTarget.value});
  };
  
  onTitleChange(e: React.FormEvent<HTMLInputElement>): void {
    this.setState({title: e.currentTarget.value});
  };

  onContentChange(length: number) {
    this.setState({wordCount: length});
  };

  checkTopicContent() {
    let message = '';
    let publisher   = this.state.publisher.trim();
    let title       = this.state.title.trim();
    let mediaAmount = getMediaAmount(this.quillRef);

    if (title == '')
      message = 'Title can not be empty.';
    else if (title.length < 3)
      message = 'Title must be at least 3 characters.';
    else if (title.length > 100)
      message = 'Title must be at most 100 characters.';
    else if (BadWords.isBad(title))
      message = 'No bad words allowed in title.';
    else if (publisher == '')
      message = 'Publisher can not be empty.';
    else if (publisher.length > 20)
      message = 'Publisher must be at most 20 characters.';
    else if (BadWords.isBad(publisher))
      message = 'No bad words allowed in publisher.';
    else if (this.state.wordCount == 0 && mediaAmount == 0)
      message = 'Topic content can not be empty.';

    this.setState({ alert: message });

    if (message == '')
      return true;
    else
      return false;
  }

  onActions(action: string) {
    this.action = action;

    let question = `Are you sure you want to ${action} this topic?`;
    if (action == 'Publish')
      question = 'Are you sure you want to publish this for everyone to see?';

    this.setState({ question: question });
  }

  onQuestionYes() {
    // this.setState({question: '', message: `${this.action} topic...`});

    // setTimeout(async () => {
    //   let id = this.topic.id;
    //   let response = null;

      // if (this.action == 'Publish')
      //   response = await Server.blogs.publishBlog(id);
      // else if (this.action == 'Unpublish')
      //   response = await Server.blogs.unpublishBlog(id);
      // else if (this.action == 'Archive')
      //   response = await Server.blogs.archiveBlog(id);
      // else if (this.action == 'Restore')
      //   response = await Server.blogs.restoreBlog(id);
      // else if (this.action == 'Delete')
      //   response = await Server.blogs.deleteBlog(id);

    //   if (response.success) {
    //     this.stateChanged = true;

    //     if (this.action == 'Publish')
    //       sessionStorage.setItem('BlogsPageFilter', 'published');
    //     else if (this.action == 'Unpublish' || this.action == 'Restore')
    //       sessionStorage.setItem('BlogsPageFilter', 'draft');
    //     else if (this.action == 'Archive')
    //       sessionStorage.setItem('BlogsPageFilter', 'archived');

    //     if (this.action != 'Delete')
    //       this.getBlogById(id);

    //     this.setState({message: '', alert: `${this.action} done!`});
    //   }
    //   else
    //     this.setState({message: '', alert: response.message})
    // }, 500);
  }

  onQuestionNo() {
    this.setState({question: ''});
  }

  onAlertClose() {
    // Server.public.removePlansFromCache();
    this.setState({alert: ''});
    // this.setState({ goPlansPage: true });
  }

  onBack() {
    if(this.stateChanged) 
      this.setState({goTopicsPage: true});
    else
      window.history.back()
  }
  
  render() {
    if (!Server.account.isLoggedIn())
      return <Navigate to="/topics" replace />;
      
    if (this.state.goTopicsPage)
      return (<Navigate to="/topics" />);

    let date = this.state.editTopic ? 'Loading...' : new Date().toLocaleString();
    if (this.state.date != '')
      date = new Date(this.state.date).toLocaleString();

    return (
      <div className="edit-topic-page">
        <div className="edit-topic-post-page-header">
          <div className="edit-topic-post-page-back-button" onClick={()=>this.onBack()}><BsFillArrowLeftCircleFill/></div>
          {date}
        </div>

        <div className="edit-topic-page-title">
          <div>Topic:</div>
          <input placeholder="Topic" value={this.state.title} onChange={this.onTitleChange} />
        </div>

        <div className="edit-topic-page-title">
          <div>Publisher:</div>
          <input placeholder="Publisher" value={this.state.publisher} onChange={this.onPublisherChange} />
        </div>

        <div className='edit-topic-page-select-row'>
          <div className="edit-topic-page-title">
            <div>Category:</div>
            <select
              className="topics-page-filter" 
              value={this.state.category} 
              onChange={this.onCategoryChange}
            >
              <option value="normal">Normal</option>
              <option value="travel">Travel</option>
              <option value="music">Music</option>
              <option value="sports">Sports</option>
              <option value="movies">Movies</option>
            </select>
          </div>

          <div className="edit-topic-page-title">
            <div>Range:</div>
            <select
              className="topics-page-filter" 
              value={this.state.range} 
              onChange={this.onRangeChange}
            >
              <option value="everyone">Everyone</option>
              {/* <option value="following">Following</option> */}
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <SharedQuillEditor
          placeholder='The first image here will be the logo.'
          hasFontSize={true} 
          onChange={this.onContentChange}
          getRef={(ref: any) => {this.quillRef = ref}} 
        />

        <div className='edit-topic-page-actions'>
          <button onClick={()=>this.onPublish()}>Publish</button>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()}/>
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    );
  }
}

export default EditTopicPage;