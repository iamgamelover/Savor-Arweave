import React from 'react';
import { NavLink } from 'react-router-dom';
import { BsBoxArrowDown, BsCardImage, BsFillBarChartFill, BsFillFileTextFill, BsGearFill, BsPersonFill, BsWallet2 } from 'react-icons/bs';
import { Server } from '../../server/server';
import '../modals/Modal.css'
import './UserMenu.css'
import MessageModal from '../modals/MessageModal';
import { publish } from '../util/event';

interface UserMenuProps {
  open: boolean;
  onClose: Function;
}

interface UserMenuState {
  message: string;
}

class UserMenu extends React.Component<UserMenuProps, UserMenuState> {
  constructor(props:UserMenuProps) {
    super(props);

    this.state = {
      message: ''
    }

    this.onClose = this.onClose.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onProfile = this.onProfile.bind(this);
  }

  onProfile() {
    publish('show-my-profile');
    this.props.onClose();
  }

  onLogout() {
    this.setState({message: 'Logging out...'});

    setTimeout(async () => {
      await Server.signOut();
      this.setState({message: ''});
      this.props.onClose();
    }, 1000);
  }

  onClose() {
    this.props.onClose();
  }

  render() {
    if(this.state.message != '') 
      return (<MessageModal message={this.state.message} />)

    if(!this.props.open)
      return (null);

    return (
      <div>
        <div className="user-menu-panel" onClick={this.onClose}>
          <NavLink className="user-menu-item" to={'/profile/' + Server.user.getId()} onClick={this.onProfile}>
            <BsPersonFill />&nbsp;&nbsp;Profile
          </NavLink>

          {/* <NavLink className="user-menu-item" to="/wallet">
            <BsWallet2 />&nbsp;&nbsp;Wallet
          </NavLink> */}

          {/* <NavLink className="user-menu-item" to="/account">
            <BsGearFill />&nbsp;&nbsp;Account
          </NavLink> */}

          <div className="user-menu-item" onClick={this.onLogout}>
            <BsBoxArrowDown />&nbsp;&nbsp;Logout
          </div>
        </div>
        <div className="user-menu-modal" onClick={this.onClose}></div>
      </div>
    )
  }
}

export default UserMenu;