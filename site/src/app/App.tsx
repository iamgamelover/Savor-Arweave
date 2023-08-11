import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import { Server } from '../server/server';
import HomePage from './pages/HomePage';
import SitePage from './pages/SitePage';
import LoadingPage from './pages/LoadingPage';
import ShopPage from './pages/ShopPage';
import PasswordPage from './pages/PasswordPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';
import { AppConfig } from './AppConfig';
import ActivityPage from './pages/ActivityPage';
import ActivityPostPage from './pages/ActivityPostPage';
import PlanPage from './pages/PlanPage';
import PlansPage from './pages/PlansPage';
import EditPlanPage from './pages/EditPlanPage';
import MissionPage from './pages/MissionPage';
import WelcomePage from './pages/WelcomePage';
import MissionsPage from './pages/MissionsPage';

interface AppState {
  allowAccess: boolean;
  postLoginPage: string;
  initialized: boolean;
  maintenance: boolean;
};

class App extends React.Component<{}, AppState> {
  constructor(props = {}) {
    super(props);

    this.state = {
      allowAccess: this.checkSecretPassword(),
      postLoginPage: 'account',
      initialized: false,
      maintenance: false
    }

    if(!this.state.maintenance)
      Server.init();

    this.setInitialized = this.setInitialized.bind(this);
    this.checkSecretPassword = this.checkSecretPassword.bind(this);
    this.setSecretPassword = this.setSecretPassword.bind(this);
    this.onAccountChanged = this.onAccountChanged.bind(this);

    window.addEventListener("beforeunload", function (e) {
      // Server.network.disconnect();
    });

  }

  componentDidMount() {
    // Server.account.addEventListener('login', this.onAccountChanged);
    // Server.account.addEventListener('logout', this.onAccountChanged);

    // if(!this.state.maintenance)
    //   Server.network.setPresence('site');
  }

  setInitialized() {
    this.setState({initialized: true});
  }

  checkSecretPassword() {
    return (localStorage.getItem('secret-password') === AppConfig.secretPassword);
  }

  setSecretPassword(password:string) {
    localStorage.setItem('secret-password', password);
    this.setState({allowAccess: this.checkSecretPassword()});
  }

  onAccountChanged() {
    this.forceUpdate();
  }

  render() {
    if (!this.state.initialized)
      return (<LoadingPage maintenance={this.state.maintenance} setInitialized={this.setInitialized} />);

    // if(!this.state.allowAccess)
    //   return (<PasswordPage setPassword={this.setSecretPassword} />);

    return (
      <BrowserRouter>
        <Routes>
          <Route path='/welcome' element={<WelcomePage />} />
          <Route path='/' element={<SitePage />}>
            <Route index element={<HomePage />} />
            <Route path='/activity' element={<ActivityPage />} />
            <Route path='/activity/post/:id' element={<ActivityPostPage />} />
            <Route path='/plans' element={<PlansPage />} />
            <Route path='/plan/:id' element={<PlanPage />} />
            <Route path='/plan/new' element={<EditPlanPage />} />
            <Route path='/plan/edit/:id' element={<EditPlanPage />} />
            <Route path='/missions' element={<MissionsPage />} />
            <Route path='/mission/:id' element={<MissionPage />} />
            <Route path='/shop' element={<ShopPage />} />
            <Route path='/profile/:id' element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
