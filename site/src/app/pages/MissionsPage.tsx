import React from 'react';
import './MissionsPage.css'
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import MissionPanel from '../elements/MissionPanel';

interface MissionsPageState {
  missions: any[];
  loading: boolean;
}

class MissionsPage extends React.Component<{}, MissionsPageState> {

  constructor(props: any) {
    super(props);
    this.state = {
      missions: [],
      loading: false,
    }

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    let missions = Server.public.getMissionsFromCache();
    let position = Server.public.getPositionFromCache();

    if (missions) {
      this.setState({ missions });
      setTimeout(() => {
        let div = document.getElementById('id-app-page');
        div.scrollTo(0, position);
      }, 10);
    }
    else
      this.getMissions();
  }

  async getMissions() {
    if (this.state.missions.length == 0)
      this.setState({loading: true});

    let response = await Server.plans.getMissions();
    if (!response.success) return;

    console.log('missions: ', response.missions)
    this.setState({ missions: response.missions, loading: false });
    Server.public.addMissionsToCache(response.missions);
  }

  renderMissions() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = this.state.missions.length - 1; i >= 0; i--)
      divs.push(<MissionPanel key={i} data={this.state.missions[i]} />);

    return divs.length > 0 ? divs : <div>No missions yet.</div>
  }

  render() {
    return (
      <div className="missions-page">
        {this.renderMissions()}
      </div>
    );
  }
}

export default MissionsPage;