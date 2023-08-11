import React from 'react';
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import { publish } from '../util/event';
import './NavBar.css';

interface NavBarButtonProps {
  icon:string,
  text:string,
  to:string,
  align?:string
}

interface NavBarButtonState {
  isMessagesButton: boolean;
  isMessagesPage: boolean;
  isFriendUpdated: boolean;
  isFriendButton: boolean;
}

class NavBarButton extends React.Component<NavBarButtonProps, NavBarButtonState> {

  constructor(props: NavBarButtonProps) {
    super(props);
    this.state = {
      isFriendUpdated: false,
      isMessagesPage: false,
      isMessagesButton: (this.props.text == 'Messages'),
      isFriendButton: (this.props.text == 'Friends'),
    };

    this.onChatUpdated  = this.onChatUpdated.bind(this);
    this.onFriendUpdated  = this.onFriendUpdated.bind(this);
  }

  componentDidMount() {
    Server.user.addEventListener('friend-updated', this.onFriendUpdated);
  }

  componentWillUnmount() {
    Server.user.removeEventListener('friend-updated', this.onFriendUpdated);
  }

  onChatUpdated(data: any) {
    this.forceUpdate();
  }

  onFriendUpdated(data: any) {
    if(data.action == 'connect' || data.action == 'disconnect' || data.action == 'presence')
      return;

    if (window.location.pathname != '/friends' && this.state.isFriendButton) 
      this.setState({ isFriendUpdated: true });
  }

  onClickButton() {
    if (this.props.text == 'Messages') {
      publish('clicked-messages-navbar-button');
    }

    if (this.props.text == 'Friends') {
      this.setState({ isFriendUpdated: false });
    }
  }

  render() {
    return (
      <NavLink className={({ isActive }) => (isActive ? "navbar-link-active" : "navbar-link")} to={this.props.to}>
        <div className="navbar-button" onClick={() => this.onClickButton()}>
          <img className="navbar-button-icon" src={this.props.icon}></img>
          <div className="navbar-text">{this.props.text}</div>
          {this.state.isMessagesButton &&
            <div className="navbar-red-circle" />
          }
          {this.state.isFriendButton && this.state.isFriendUpdated &&
            <div className="navbar-red-circle" />
          }
        </div>
      </NavLink>
    );
  }
}

export default NavBarButton;