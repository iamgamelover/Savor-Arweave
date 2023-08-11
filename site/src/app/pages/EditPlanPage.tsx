import React from 'react';
import './EditPlanPage.css'
import { BsFillArrowLeftCircleFill, BsFillXCircleFill, BsPencilFill } from 'react-icons/bs';
import { Navigate } from 'react-router-dom';
import QuestionModal from '../modals/QuestionModal';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import { Server } from '../../server/server';
import BadWords from '../util/badWords';
import { getMediaAmount } from '../util/util';

interface EditPlanPageState {
  publisher: string;
  title: string;
  date: string;
  slug: string;
  newSlug: string;
  tags: string;
  wordCount: number;
  openEditSlug: boolean;
  goPlansPage: boolean;
  question: string;
  message: string;
  alert: string;
  editBlog: boolean;
  brandNew: boolean;
  slugEdited: boolean;
}

class EditPlanPage extends React.Component<{}, EditPlanPageState> {

  quillRef: any;
  blog: any = {id: '', state: ''};
  action: string;
  stateChanged: boolean;

  constructor(props: any) {
    super(props);
    this.quillRef = null;
    this.state = {
      publisher: '',
      title: '',
      date: '',
      slug: '',
      newSlug: '',
      tags: '',
      wordCount: 0,
      openEditSlug: false,
      goPlansPage: false,
      question: '',
      message: '',
      alert: '',
      editBlog: true,
      brandNew: false,
      slugEdited: false,
    }

    this.stateChanged = false;

    this.onPublisherChange = this.onPublisherChange.bind(this);
    this.onTitleChange = this.onTitleChange.bind(this);
    this.onTagsChange = this.onTagsChange.bind(this);
    this.onSlugChange = this.onSlugChange.bind(this);
    this.setNewSlug = this.setNewSlug.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
  }

  componentDidMount () {
    let path = window.location.pathname;
    if (path.substring(6) == 'new')
      this.setState({editBlog: false, brandNew: true});
    else
      this.getBlog(path.substring(11));
  }
  
  async getBlog(slug: string) {
    // let response = await Server.blogs.getBlog({slug});
    // if (!response.success)
    //   return

    // this.blog = response.blog;
    // this.setState({
    //   title: this.blog.title,
    //   slug: this.blog.slug,
    //   tags: this.blog.tags,
    //   date: this.blog.date
    // });

    // let content = decodeURIComponent(this.blog.content);
    // this.quillRef.root.innerHTML = content;
  }
  
  async getBlogById(id: string) {
    // let response = await Server.blogs.getBlog({id});
    // if (!response.success)
    //   return

    // this.blog = response.blog;
  }

  async onPublish() {
    if (!this.checkPlanContent())
      return;

    if (!this.checkSlug(this.state.slug))
      return;

    this.action = '';

    let summary = this.quillRef.getText().trim();
    if (summary.length > 150)
      summary = summary.substring(0, 150) + '...';

    let content = this.quillRef.root.innerHTML;
    let params = {
      banner:  '/banner-planets.png', // will be updated
      slug:  this.state.slug,
      title: this.state.title,
      publisher: this.state.publisher,
      summary: summary,
      content: encodeURIComponent(content),
    }

    let paramsEdit;
    if (this.state.editBlog)
      paramsEdit = {...{id: this.blog.id}, ...params}

    this.setState({message: 'Publishing...'});

    let response = null;
    if (this.state.editBlog)
      response = await Server.plans.createPlan(paramsEdit);
    else
      response = await Server.plans.createPlan(params);

    if (response.success) {
      // if (!this.state.editBlog) { // new blog
        // this.getBlogById(response.id);
        // sessionStorage.setItem('BlogsPageFilter', 'draft');
        // this.setState({date: new Date().toLocaleString()});
      // }

      // this.setState({message: '', alert: 'Published!', editBlog: true, brandNew: false});

      Server.public.removePlansFromCache();
      this.setState({message: '', goPlansPage: true});
    }
    else
      this.setState({message: '', alert: response.message})
  }

  checkSlug(slug: string) {
    let message = '';
    slug = slug.trim();

    if(slug.length < 3) 
      message = 'Permalink must be at least 3 characters.';

    if(slug.length > 100) 
      message = 'Permalink must be at most 100 characters.';
  
    if(slug.indexOf('--') != -1) 
      message = 'Permalink cannot contain consecutive dash (-) characters.';
      
    let re = /^[a-zA-Z0-9-]+$/;
    if(!re.test(slug)) 
      message = 'Permalink may only contain a-z, A-Z, 0-9, and dash (-) characters.';

    if(slug.length == 0)
      message = 'Permalink can not be empty.';

    this.setState({ alert: message });

    if (message == '')
      return true;
    else
      return false;
  }

  onPublisherChange(e: any) {
    this.setState({publisher: e.currentTarget.value});
  };

  onTitleChange(e: React.FormEvent<HTMLInputElement>): void {
    let value = e.currentTarget.value;

    let noSpecial = value.replace(/[^a-zA-Z0-9 ]/, '');
    let words = noSpecial.match(/\w+/g);
    let slug = words ? words.join('-') : '';

    this.setState({
      title: value,
      slug: this.state.slugEdited ? this.state.slug : slug.toLowerCase()
    });
  };

  onTagsChange(e: React.FormEvent<HTMLInputElement>): void {
    let value = e.currentTarget.value;
    this.setState({ tags: value });
  };

  onSlugChange(e: React.FormEvent<HTMLInputElement>): void {
    let value = e.currentTarget.value;
    let slug = value.replaceAll(' ', '-');
    this.setState({ newSlug: slug });
  };

  onContentChange(length: number) {
    this.setState({wordCount: length});
  };

  checkPlanContent() {
    let message = '';
    let publisher   = this.state.publisher.trim();
    let title       = this.state.title.trim();
    let mediaAmount = getMediaAmount(this.quillRef);

    if (publisher == '')
      message = 'Publisher can not be empty.';
    else if (publisher.length > 20)
      message = 'Publisher must be at most 20 characters.';
    else if (title == '')
      message = 'Title can not be empty.';
    else if (title.length < 3)
      message = 'Title must be at least 3 characters.';
    else if (title.length > 100)
      message = 'Title must be at most 100 characters.';
    else if (BadWords.isBad(title))
      message = 'No bad words allowed in title.';
    // else if (this.state.tags.trim() == '')
    //   message = 'Tags can not be empty.';
    else if (this.state.wordCount == 0 && mediaAmount == 0)
      message = 'Blog content can not be empty.';

    this.setState({ alert: message });

    if (message == '')
      return true;
    else
      return false;
  }

  onClose() {
    this.setState({openEditSlug: false});
  }

  //-----------------------------
  // Edit blog slug modal functions

  openEditSlug() {
    this.setState({ openEditSlug: true, newSlug: this.state.slug });
  }

  setNewSlug() {
    if (!this.checkSlug(this.state.newSlug))
      return;

    this.onClose();
    this.setState({ slug: this.state.newSlug, slugEdited: true });
  }

  EditSlugModal = () => {
    if(!this.state.openEditSlug)
      return (<div></div>);

    return (
      <div className="modal open">
        <div className="modal-content">
          <button className="modal-close-button" onClick={this.onClose}>
            <BsFillXCircleFill />
          </button>
          <div className="edit-slug-modal-header">Edit Permalink</div>

          <div className="edit-blog-page-title">
            <div>Permalink:</div>
            <input value={this.state.newSlug} onChange={this.onSlugChange} />
          </div>

          <div className="edit-slug-modal-button-panel">
            <button onClick={this.onClose}>Cancel</button>
            <button onClick={this.setNewSlug}>OK</button>
          </div>
        </div>
      </div>
    );
  }

  onActions(action: string) {
    this.action = action;

    let question = `Are you sure you want to ${action} this blog?`;
    if (action == 'Publish')
      question = 'Are you sure you want to publish this for everyone to see?';

    this.setState({ question: question });
  }

  onQuestionYes() {
    // this.setState({question: '', message: `${this.action} blog...`});

    // setTimeout(async () => {
    //   let id = this.blog.id;
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
      this.setState({goPlansPage: true});
    else
      window.history.back()
  }
  
  render() {
    // if(!Server.account.isLoggedIn())
    //   return <Navigate to="/" replace />;
      
    if (this.state.goPlansPage)
      return (<Navigate to="/plans" />);

    let date = this.state.editBlog ? 'Loading...' : new Date().toLocaleString();
    if(this.state.date != '')
      date = new Date(this.state.date).toLocaleString();

    return (
      <div className="edit-blog-page">
        <div className="edit-blog-post-page-header">
          <div className="edit-blog-post-page-back-button" onClick={()=>this.onBack()}><BsFillArrowLeftCircleFill/></div>
          {date}
        </div>

        <div className="edit-blog-page-title">
          <div>Publisher:</div>
          <input placeholder="Publisher" value={this.state.publisher} onChange={this.onPublisherChange} />
        </div>

        <div className="edit-blog-page-title">
          <div>Topic:</div>
          <input placeholder="Topic" value={this.state.title} onChange={this.onTitleChange} />
        </div>

        {/* <div className='edit-blog-page-slug'>
          <div className='edit-blog-page-slug-text'>Permalink: {window.location.host}/plan/{this.state.slug}</div>
          <div className='edit-blog-page-slug-edit-button' onClick={()=>this.openEditSlug()}><BsPencilFill/></div>
        </div> */}

        {/* <div className="edit-blog-page-title">
          <div>Tags:</div>
          <input placeholder="(coming soon)" value={this.state.tags} onChange={this.onTagsChange} disabled={true} />
        </div> */}

        <SharedQuillEditor
          placeholder='Enter plan content, the first image here will be the logo...'
          hasFontSize={true} 
          onChange={this.onContentChange}
          getRef={(ref: any) => {this.quillRef = ref}} 
        />

        <div className='edit-blog-page-actions'>
          <button onClick={()=>this.onPublish()}>Publish</button>
        </div>

        {/* <this.EditSlugModal /> */}
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.onAlertClose()}/>
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    );
  }
}

export default EditPlanPage;