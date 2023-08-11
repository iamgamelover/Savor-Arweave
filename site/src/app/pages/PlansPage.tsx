import React from 'react';
import './PlansPage.css'
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import { PLANS_SHEET_ID } from '../util/consts';
import { formatTimestamp, getFirstImage } from '../util/util';
import { subscribe } from '../util/event';

interface PlansPageState {
  plans: any[];
  loading: boolean;
}

class PlansPage extends React.Component<{}, PlansPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      plans: [],
      loading: false,
    }

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    let plans    = Server.public.getPlansFromCache();
    let position = Server.public.getPositionFromCache();

    if (plans) {
      this.setState({plans});
      setTimeout(() => {
        let div = document.getElementById('id-app-page');
        div.scrollTo(0, position);
      }, 10);
    }
    else
      this.getPlans();
  }

  // componentWillUnmount(): void {
  //   let div = document.getElementById('id-app-page');
  //   Server.public.addPositionToCache(div.scrollTop);
  // }

  async getPlans() {
    if (this.state.plans.length == 0)
      this.setState({loading: true});

    let response = await Server.plans.getPlans();
    if (!response.success) return;

    console.log('plans: ', response.plans)
    this.setState({ plans: response.plans, loading: false });
    Server.public.addPlansToCache(response.plans);
  }

  renderPlans() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = this.state.plans.length - 1; i >= 0; i--) {
      let data = this.state.plans[i];
      divs.push(
        <NavLink key={i} className='plan-card' to={'/plan/' + data.slug}>
          <div className='plan-card-image-container'>
            <img className='plan-card-image' src={data.image} />
          </div>
          <div>
            <div className='plan-card-header'>
              <div className='plan-card-publisher'>{data.publisher}</div>
              <div className='plan-card-summary'>·</div>
              <div className='plan-card-summary'>{formatTimestamp(data.date, true)}</div>
            </div>
            <div className='plan-card-title'>{data.title}</div>
            <div className='plan-card-summary'>{data.summary}</div>
          </div>
        </NavLink>
      )
    }

    return divs.length > 0 ? divs : <div>No plans yet.</div>
  }

  render() {
    return (
      <div className="plans-page">
        <div className='plans-page-actions'>
          {Server.account.isLoggedIn() &&
            <NavLink to='/plan/new'>
              <button>New Topic</button>
            </NavLink>
          }

          {/* <select
            className="plans-page-filter" 
            value={this.state.category} 
            onChange={this.onCategoryChange}
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select> */}
        </div>

        {this.renderPlans()}
      </div>
    );
  }
}

export default PlansPage;