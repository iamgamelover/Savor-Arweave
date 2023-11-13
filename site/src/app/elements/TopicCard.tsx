import React from 'react';
import { Server } from '../../server/server';
import { formatTimestamp, getFirstImage } from '../util/util';
import './TopicCard.css';
import { NavLink } from 'react-router-dom';
import { BsPersonFillLock } from 'react-icons/bs';

interface TopicCardProps {
  data: any;
}

interface TopicCardState {
  content: string;
  image: string;
}

class TopicCard extends React.Component<TopicCardProps, TopicCardState> {

  constructor(props: TopicCardProps) {
    super(props);
    this.state = {
      content: '',
      image: ''
    };
  }

  componentDidMount() {
    this.getTopicContent();
  }
  
  async getTopicContent() {
    let content = Server.public.getTopicContentFromCache(this.props.data.id);
    if (!content) {
      content = await Server.public.downloadFromArweave(this.props.data.url);
      Server.public.addTopicContentToCache(this.props.data.id, content);
    }

    let image = getFirstImage(content);
    if (!image) image = '/topic-default.jpg';
    this.setState({ content, image });
  }

  render() {
    let data = this.props.data;

    return (
      <NavLink className='topic-card' to={'/topic/' + data.id}>
        <div className='topic-card-image-container'>
          <img className='topic-card-image' src={this.state.image} />
        </div>
        <div>
          <div className='topic-card-header'>
            <div className='topic-card-publisher'>{data.publisher}</div>
            <div className='topic-card-summary'>·</div>
            <div className='topic-card-summary'>{formatTimestamp(data.created_at / 1000, true)}</div>
            {data.range === 'private' && <BsPersonFillLock size={20} color='gray' />}
          </div>
          <div className='topic-card-title'>{data.title}</div>
          <div className='topic-card-summary'>{data.summary}</div>
        </div>
      </NavLink>
    )
  }
}

export default TopicCard;