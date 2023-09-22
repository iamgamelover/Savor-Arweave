import React from 'react';
import './MissionsPage.css'
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import ActivityPost from '../elements/ActivityPost';

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

    let response = await Server.topic.getMissions();
    if (!response.success) return;

    // console.log('missions: ', response.missions)
    this.setState({ missions: response.missions, loading: false });
  }

  renderMissions() {
    if(this.state.loading) 
      return (<div>Loading...</div>); 

    let divs = [];
    for (let i = 0; i < this.state.missions.length; i++)
      divs.push(<ActivityPost key={i} data={this.state.missions[i]} isMission={true} />);

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