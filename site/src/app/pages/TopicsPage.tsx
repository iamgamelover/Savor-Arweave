import React from 'react';
import './TopicsPage.css'
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import { formatTimestamp, getFirstImage } from '../util/util';
import { subscribe } from '../util/event';
import { BsArrowClockwise } from 'react-icons/bs';

interface TopicsPageState {
  topics: any[];
  loading: boolean;
  category: string;
}

class TopicsPage extends React.Component<{}, TopicsPageState> {

  allTopics: any;

  constructor(props: any) {
    super(props);
    this.state = {
      topics: [],
      loading: false,
      category: ''
    }

    this.onCategoryChange = this.onCategoryChange.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    let topics   = Server.public.getTopicsFromCache();
    let position = Server.public.getPositionFromCache();

    if (topics) {
      this.allTopics = topics;
      this.setState({topics});
      setTimeout(() => {
        let div = document.getElementById('id-app-page');
        div.scrollTo(0, position);
      }, 10);
    }
    else
      this.getTopics();
  }

  // componentWillUnmount(): void {
  //   let div = document.getElementById('id-app-page');
  //   Server.public.addPositionToCache(div.scrollTop);
  // }

  onCategoryChange(e: any) {
    let category = e.currentTarget.value;
    
    if (category === 'all')
      this.setState({category, topics: this.allTopics });
    else {
      let topics = this.allTopics.filter((item: any) => {
        return item.category == category;
      });
      this.setState({category, topics });
    }
  };

  async getTopics() {
    if (this.state.topics.length == 0)
      this.setState({loading: true});

    let response = await Server.topic.getTopics();
    if (!response.success) return;

    let topics = response.topics;
    console.log('topics: ', topics)
    this.allTopics = topics;
    this.setState({ topics, loading: false });
  }

  renderTopics() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = 0; i < this.state.topics.length; i++) {
      let data = this.state.topics[i];
      divs.push(
        <NavLink key={i} className='topic-card' to={'/topic/' + data.id}>
          <div className='topic-card-image-container'>
            <img className='topic-card-image' src={data.image} />
          </div>
          <div>
            <div className='topic-card-header'>
              <div className='topic-card-publisher'>{data.publisher}</div>
              <div className='topic-card-summary'>·</div>
              <div className='topic-card-summary'>{formatTimestamp(data.block_timestamp, true)}</div>
            </div>
            <div className='topic-card-title'>{data.title}</div>
            <div className='topic-card-summary'>{data.summary}</div>
          </div>
        </NavLink>
      )
    }

    return divs.length > 0 ? divs : <div>No topics yet.</div>
  }

  render() {
    return (
      <div className="topics-page">
        <div className='topics-page-actions'>
          {Server.account.isLoggedIn() &&
            <NavLink to='/topic/new'>
              <button>New Topic</button>
            </NavLink>
          }

          <div style={{display: 'flex'}}>
            <select
              className="topics-page-filter" 
              value={this.state.category} 
              onChange={this.onCategoryChange}
            >
              <option value="all">All</option>
              <option value="travel">Travel</option>
              <option value="music">Music</option>
              <option value="sports">Sports</option>
              <option value="movies">Movies</option>
            </select>

            <div className="topics-page-action-button" onClick={()=>this.getTopics()}>
              <BsArrowClockwise />
            </div>
          </div>
        </div>

        {this.renderTopics()}
      </div>
    );
  }
}

export default TopicsPage;