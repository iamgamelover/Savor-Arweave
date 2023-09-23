import React from 'react';
import './TopicsPage.css'
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import { BsArrowClockwise } from 'react-icons/bs';
import TopicCard from '../elements/TopicCard';

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
    this.setState({topics: []});
    
    setTimeout(() => {
      if (category === 'all')
        this.setState({category, topics: this.allTopics });
      else {
        let topics = this.allTopics.filter((item: any) => {
          return item.category == category;
        });
        this.setState({category, topics });
      }
    }, 20);
  };

  async getTopics() {
    if (this.state.topics.length == 0)
      this.setState({loading: true});

    let response = await Server.topic.getTopics();
    if (!response.success) return;

    let topics = response.topics;
    this.allTopics = topics;
    this.setState({ topics, loading: false });
  }

  renderTopics() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = 0; i < this.state.topics.length; i++)
      divs.push(<TopicCard key={i} data={this.state.topics[i]}/>)

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