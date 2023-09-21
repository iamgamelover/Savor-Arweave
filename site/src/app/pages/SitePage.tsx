import React from 'react';
import {Navigate, Outlet} from 'react-router-dom';
import HeaderBar from '../elements/HeaderBar';
import NavBar from '../elements/NavBar';
import withRouter from '../util/withRouter';
import { subscribe } from '../util/event';
import LoginModal from '../modals/LoginModal';

const HeaderBarWithRouter = withRouter(HeaderBar);

class SitePage extends React.Component {
  render() {
    if (!localStorage.getItem('welcomed'))
      return <Navigate to="/welcome" replace />;
      
    return (
      <div className="app-container">
        <div>
          <HeaderBarWithRouter />
        </div>
        <div className="app-content">
          <div className="app-navbar">
            <NavBar />
          </div>
          <div id="id-app-page" className="app-page">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }
}

export default SitePage;
