import React from 'react';
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import '../modals/Modal.css'
import './SiteMenu.css'
import { getMenuIcon } from '../util/util';
import { AppConfig } from '../AppConfig';

interface SiteMenuProps {
  open: boolean;
  onClose: Function;
}

interface SiteMenuState {
  isFriendUpdated: boolean;
}

class SiteMenu extends React.Component<SiteMenuProps, SiteMenuState> {
  constructor(props:SiteMenuProps) {
    super(props);

    this.state = {
      isFriendUpdated: true
    }

    this.onClose = this.onClose.bind(this);
    this.onClearFriend = this.onClearFriend.bind(this);
    this.onChatUpdated = this.onChatUpdated.bind(this);
    this.onFriendUpdated = this.onFriendUpdated.bind(this);
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

    if (window.location.pathname != '/friends') 
      this.setState({ isFriendUpdated: true });
  }

  onClearFriend() {
    this.setState({isFriendUpdated: false})
  }

  onClose() {
    this.props.onClose();
  }

  renderButton(menu: any) {
    return (
      <NavLink key={menu.text} className="site-menu-item" to={menu.to} onClick={menu.text == 'Friends' && this.onClearFriend}>
        <img className="site-menu-icon" src={getMenuIcon(menu.icon)} />
        {menu.text}

        {menu.text == 'Messages' &&
          <div className="site-menu-red-circle" />
        }

        {menu.text == 'Friends' && this.state.isFriendUpdated &&
          <div className="site-menu-red-circle" />
        }
      </NavLink>
    )
  }
  
  render() {
    if(!this.props.open)
      return (<div></div>);

    let buttons = [];
    let menu = AppConfig.menu;

    for (let i = 0; i < menu.length; i++) {
      if (menu[i].loggedIn) {
        if (Server.account.isLoggedIn())
          buttons.push(this.renderButton(menu[i]));
      }
      else
        buttons.push(this.renderButton(menu[i]));
    }

    return (
      <div>
        <div className="site-menu-panel" onClick={this.onClose}>
          {buttons}
          <div className='site-menu-bottom'>powered by<br/>OneClick</div>
        </div>
        <div className="site-menu-modal" onClick={this.onClose}></div>
      </div>
    )
  }
}

export default SiteMenu;