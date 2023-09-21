import React from 'react';
import { BsChat, BsCoin, BsFillAwardFill, BsHeart, BsHeartFill } from 'react-icons/bs';
import { capitalizeFirstLetter, convertHashTag, convertSlug, convertUrls, numberWithCommas } from '../util/util';
import { Server } from '../../server/server';
import { formatTimestamp } from '../util/util';
import './MissionPanel.css';
import parse, { attributesToProps } from 'html-react-parser';
import { Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';

interface MissionPanelProps {
  data: any;
  afterRepost?: Function;
  beforeJump?: Function;
  isReply?: boolean;
  isResource?: boolean;
}

interface MissionPanelState {
  openImage: boolean;
  navigate: string;
}

class MissionPanel extends React.Component<MissionPanelProps, MissionPanelState> {

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

  constructor(props: MissionPanelProps) {
    super(props);

    let data = this.props.data;
    // this.id = post.id;

    this.state = {
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

  goProfilePage(e: any, slug: string) {
    e.stopPropagation();
    if (window.location.pathname.indexOf('/profile/') == 0)
      return;

    this.setState({navigate: '/profile/' + slug});
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

  onCoins(e: any) {
    e.stopPropagation();
  }

  renderActionsRow(data: any) {
    return (
      <div className='mission-panel-action-row'>
        <div className='mission-panel-action'>
          <div className='mission-panel-action-icon'>
            <BsChat />
          </div>
          <div className='mission-panel-action-number'>
            {numberWithCommas(data.doing)}
          </div>
        </div>

        <div className='mission-panel-action' onClick={(e)=>this.onCoins(e)}>
          <div className='mission-panel-action-icon'>
            <BsCoin />
          </div>
          <div className='mission-panel-action-number'>
            {numberWithCommas(Number(data.coins))}
          </div>
        </div>

        <div className='mission-panel-action'>
          <img style={{width:'20px', height:'20px', marginRight: '5px'}} src='/coin.png' />
          <div className='mission-panel-action-number'>
            {numberWithCommas(Number(data.award))}
          </div>
        </div>

        <div className='mission-panel-action'>
          <img style={{width:'22px', height:'22px', marginRight: '5px'}} src='/icon/plant.png' />
          <div className='mission-panel-action-number'>
            {capitalizeFirstLetter(data.dream)}
          </div>
        </div>
      </div>
    )
  }

  render() {
    let data = this.props.data;
    let date = formatTimestamp(data.block_timestamp, true);
    let content = convertHashTag(data.content);
    content     = convertUrls(content);

    if (this.state.navigate) 
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        style={{cursor: this.state.openImage || this.props.isReply || this.props.isResource ? 'auto' : 'pointer'}}
        onClick={()=>this.goMissionPage(data.id)}
      >
        <div className='mission-panel-row-header'>
          {date}
          
        </div>

        <div className="mission-panel-row">
          {/* <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center'}} onClick={(e)=>this.goProfilePage(e, oriAuthor.slug)}>
              <img className="mission-panel-portrait" src={getPortraitImage(oriAuthor)} />
              <div className="mission-panel-author">
                {oriAuthor.id == Server.user.getId() ? 'You' : oriAuthor.name + ' @' + oriAuthor.slug}
              </div>
            </div>
          </div> */}

          <div>{parse(content, this.parseOptions)}</div>

          {!this.props.isResource &&
            this.renderActionsRow(data)
          }
        </div>

        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default MissionPanel;