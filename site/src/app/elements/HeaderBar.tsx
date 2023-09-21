import React from 'react';
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';
import { getPortraitImage } from '../util/util';
import { WithRouterProps } from '../util/withRouter';
import UserMenu from './UserMenu';
import SiteMenu from './SiteMenu';
import LoginModal from '../modals/LoginModal';
import './HeaderBar.css';
import { subscribe } from '../util/event';

interface HeaderBarProps {
  router: WithRouterProps;
}

interface HeaderBarState {
  openSiteMenu: boolean;
  openUserMenu: boolean;
  openLogin: boolean;
  isFriendUpdated: boolean;
}

class HeaderBar extends React.Component<HeaderBarProps, HeaderBarState> {
  constructor(props: HeaderBarProps) {
    super(props);
    this.state = {
      openSiteMenu: false,
      openUserMenu: false,
      openLogin: false,
      isFriendUpdated: false,
    };

    this.onChatUpdated = this.onChatUpdated.bind(this);
    this.onFriendUpdated = this.onFriendUpdated.bind(this);
    this.openSiteMenu = this.openSiteMenu.bind(this);
    this.openUserMenu = this.openUserMenu.bind(this);
    this.closeUserMenu = this.closeUserMenu.bind(this);
    this.closeSiteMenu = this.closeSiteMenu.bind(this);
    this.openLogin = this.openLogin.bind(this);
    this.closeLogin = this.closeLogin.bind(this);
    this.onPopState = this.onPopState.bind(this);
    this.onUserProfileUpdated = this.onUserProfileUpdated.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
      // this.checkChain();
    });
  }

  componentDidMount() {
    Server.user.addEventListener('friend-updated', this.onFriendUpdated);
    Server.user.addEventListener('user-profile-updated', this.onUserProfileUpdated);
  }

  componentWillUnmount() {
    Server.user.removeEventListener('friend-updated', this.onFriendUpdated);
    Server.user.removeEventListener('user-profile-updated', this.onUserProfileUpdated);
  }
  
  onPopState(event:any) {
    console.log(window.location.pathname);
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

  onUserProfileUpdated() {
    this.forceUpdate();
  }

  openSiteMenu() {
    this.setState({ openSiteMenu: true, isFriendUpdated: false });
  }

  closeSiteMenu() {
    this.setState({ openSiteMenu: false });
  }

  openUserMenu() {
    this.setState({ openUserMenu: true });
  }

  closeUserMenu() {
    this.setState({ openUserMenu: false });
  }

  openLogin() {
    this.setState({ openLogin: true });
  }

  closeLogin() {
    this.setState({ openLogin: false });
  }

  render() {
    let profile = Server.user.getProfile();
    let portrait = getPortraitImage(profile);
    let path = this.props.router.location.pathname;
    let pageName = '';

    if(path == '/')
      pageName = 'Home';
    else if(path.indexOf('/profile/') == 0)
      pageName = 'Profile';
    else if(path.indexOf('/topic/') == 0)
      pageName = 'Topic';
    else if(path.indexOf('/activity/post/') == 0)
      pageName = 'View Activity';
    else if(path.indexOf('/mission/') == 0)
      pageName = 'View Mission';
    else {
      pageName = path;
      let n = pageName.lastIndexOf('/');
      if(n != -1) {
        pageName = pageName.substring(n+1);
        let parts = pageName.split('-');
        pageName = '';
        for(let i = 0; i < parts.length; i++) {
          if(i > 0)
            pageName += ' ';
          pageName += parts[i].substring(0, 1).toUpperCase() + parts[i].substring(1);
        }

        if(path.indexOf('/contest/') == 0)
          pageName += ' Contest';
      }
    }

    // let address = Server.account.getWallet();
    // let address = Server.user.getName();
    // if (address)
    //   address = address.substring(0, 6) + '...' + address.substring(address.length - 4);

    return (
      <div className="headerbar-container">
        <NavLink to='/'>
          <img className="headerbar-logo" src="/navbar-icon.png"></img>
        </NavLink>

        <img className="popup-menu" src="/navbar-icon.png" onClick={this.openSiteMenu} />
        
        {(this.state.isFriendUpdated) &&
          <div className="headerbar-red-circle" />
        }

        <div className="headerbar-content">
          <div className="headerbar-pagename">{pageName}</div>
          <div className="headerbar-pagename-mobile" onClick={this.openSiteMenu}>{pageName}</div>

          {Server.account.isLoggedIn() && 
            <div className="headerbar-username" onClick={this.openUserMenu}>{Server.user.getName()}</div>
          }

          {Server.account.isLoggedIn() && 
            <img className="headerbar-portrait" src={portrait} onClick={this.openUserMenu}/>
          }

          {!Server.account.isLoggedIn() && 
            <div className="headerbar-login" onClick={this.openLogin}>Login</div>
          }
        </div>

        <UserMenu open={this.state.openUserMenu} onClose={this.closeUserMenu} />
        <SiteMenu open={this.state.openSiteMenu} onClose={this.closeSiteMenu} />
        <LoginModal open={this.state.openLogin} onClose={this.closeLogin} />
      </div>
    );
  }
}

export default HeaderBar;