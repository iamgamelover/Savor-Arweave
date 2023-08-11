import React from 'react';
import './WelcomePage.css'
import { AppConfig } from '../AppConfig';
import { Navigate } from 'react-router-dom';

interface WelcomePageState {
  dreams: any[];
  navigate: string;
}

class WelcomePage extends React.Component<{}, WelcomePageState> {

  timerDreams: any;

  constructor(props: {}) {
    super(props);
    this.state = {
      dreams: AppConfig.dreams,
      navigate: ''
    };
  }

  onEnter() {
    localStorage.setItem('welcomed', '1');
    this.setState({ navigate: '/' });
  }

  renderDreams() {
    let buttons = [];
    let dreams = this.state.dreams;

    for (let i = 0; i < dreams.length; i++) {
      buttons.push(
        <img 
          key={i} 
          className='welcome-page-dream' 
          src={dreams[i].icon} 
        />
      );
    }

    return (
      <div className='welcome-page-dream-container'>
        {buttons}
      </div>
    )
  }

  render() {
    if (this.state.navigate) 
      return <Navigate to={this.state.navigate} />;
      
    return (
      <div className='welcome-page'>
        <div className='welcome-page-header'>
          <img className='welcome-page-header-image' src="/dream.jpg" />
          <div className='welcome-page-slug'>We all have a dream as a child. <br/><br/> We often lose it when we grow up.</div>
        </div>

        <div className='welcome-page-pick'>Pick your dream up again!</div>

        <div className='welcome-page-row'>
          {this.renderDreams()}

          <div className='welcome-page-row-text'>
            Astronaut, Botanist, Doctor, Rocket & Robot Engineer... <br/> We all have one of these dreams as a child. <br/><br/> 
            <span style={{color: 'yellow'}}>Dream is not about a specific thing, <br/> it is about how you are a part of this world.</span>
          </div>
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/school.png" />
          <div className='welcome-page-row-text'>
            To reach the dream, most of us learn from school.<br/><br/>
            <span style={{color: 'yellow'}}>School is a good place, <br/> but maybe is not a happy place.</span>
          </div>
          <img className='welcome-page-row-image' src="/school.png" />
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/teacher.png" />
          <img className='welcome-page-row-image' src="/teacher.png" />
          <div className='welcome-page-row-text'>
            Probably, you have to learn stuffs that are boring.<br/><br/>
            <span style={{color: 'yellow'}}>All of this is just for getting a decent job, <br/> Not about the dream.</span>
          </div>
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/video-bg.png" />
          <div className='welcome-page-row-text'>
            Let's build a place that outside of the school.<br/><br/>
            <span style={{color: 'yellow'}}>Learning you interesting, <br/> Just about the dream.</span>
          </div>
          <img className='welcome-page-row-image' src="/video-bg.png" />
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/mission-bg.png" />
          <img className='welcome-page-row-image' src="/mission-bg.png" />
          <div className='welcome-page-row-text'>
            You will get missions that you like to do.<br/><br/>
            <span style={{color: 'yellow'}}>Missions that will solve big problems, <br/> Reach the dream.</span>
          </div>
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/reward-bg.png" />
          <div className='welcome-page-row-text'>
            You will get reward while you take the mission.<br/><br/>
            <span style={{color: 'yellow'}}>A crypto asset that will become valuable.</span>
          </div>
          <img className='welcome-page-row-image' src="/reward-bg.png" />
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/life-bg.png" />
          <img className='welcome-page-row-image' src="/life-bg.png" />
          <div className='welcome-page-row-text'>
            Get better life.<br/><br/>
            <span style={{color: 'yellow'}}>To change your life with the reward.</span>
          </div>
        </div>

        <div className='welcome-page-row'>
          <img className='welcome-page-row-image-mobile' src="/happy-bg.png" />
          <div className='welcome-page-row-text'>
            Post your happy!<br/><br/>
            <span style={{color: 'yellow'}}>Find interesting things, share it, enjoy it!</span>
          </div>
          <img className='welcome-page-row-image' src="/happy-bg.png" />
        </div>

        <div className='welcome-page-foot'>
          <div className='welcome-page-foot-text'>The place for anyone from anywhere<br/>to make anything</div>
          <div className='welcome-page-foot-button' onClick={()=>this.onEnter()}>Let's Go!</div>
        </div>
      </div>
    );
  }
}

export default WelcomePage;
