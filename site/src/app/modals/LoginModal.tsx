import React from 'react';
import { Server } from '../../server/server';
import { BsFillXCircleFill } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './LoginModal.css'
import { ethers } from 'ethers';
import { publish } from '../util/event';
import Web3 from 'web3';
import { browserDetect } from '../util/util';
import MessageModal from './MessageModal';

declare var window: any;

interface LoginModalProps {
  open: boolean;
  onClose: Function;
}

interface LoginModalState {
  message: string;
  alert: string;
}

class LoginModal extends React.Component<LoginModalProps, LoginModalState> {
  constructor(props:LoginModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
    }
  }
  
  // Connect to Metamask
  async onMetamask() {
    let name = browserDetect();
    if (name === 'safari' || name === 'ie' || name === 'yandex' || name === 'others') {
      this.setState({ alert: 'MetaMask is not supported for this browser! Please use the Wallect Connect.' });
      return;
    }
    
    if (typeof window.ethereum === 'undefined') {
      this.setState({ alert: 'MetaMask is not installed!' });
      return;
    }
    
    try {
      let provider   = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address  = accounts[0];
      console.log("[ address ]", address);

      this.props.onClose();
      LoginModal.initUser(address);
    } catch (error: any) {
      this.setState({ alert: error.message });
    }
  }

  static async initUser(address: string) {
    localStorage.setItem('metamask', address);
    Server.web3 = new Web3(window.ethereum);

    try {
      let user = await Server.public.registerUser(address);
      Server.user.user = user;
      publish('wallet-events');
    } catch (error) {
      console.log("ERR:", error);
    }
  }

  public static subscribeMetaMaskEvents() {
    try {
      const { ethereum } = window as any
  
      ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log("[ accountsChanged ]", accounts);

        // It's meaning that the user is logged out.
        if (accounts.length === 0) {
          localStorage.removeItem('metamask');
          publish('wallet-events');
        }

        // Switch to a new user.
        else
          LoginModal.initUser(accounts[0]);
      });
  
      ethereum.on('chainChanged', (chainId: string) => {
        console.log("chainChanged", chainId);
        publish('wallet-events');
      });
    } catch (error) {
      console.error(error);
    }
  }

  // wc-2.0
  async onWallectConnect() {
    try {
      await Server.provider.enable();
  
      if (Server.account.isLoggedIn()) {
        Server.web3 = new Web3(Server.provider);
        this.props.onClose();
        await Server.user.sync();
        publish('wallet-events');
      }
    } catch (error) {
      this.setState({ alert: 'User rejected the request or Connection is existed. Please check the wallet app or refresh the page.' });
    }
  }

  render() {
    if(!this.props.open)
      return (<div></div>);

    if(this.state.alert != '')
      return (<AlertModal message={this.state.alert} button="OK" onClose={()=>this.setState({alert: ''})}/>)

    return (
      <div className="modal open">
        <div className="login-modal-content">
          <button className="modal-close-button" onClick={()=>this.props.onClose()}>
            <BsFillXCircleFill />
          </button>

          <div className='login-modal-button-mm'>
            <img className="login-modal-icon" src='/icon/mm.png' /> 
            <button style={{width: '170px'}} onClick={()=>this.onMetamask()}>Meta Mask</button>
          </div>
          <br/>

          {/* <div className='login-modal-button-wc'>
            <img className="login-modal-icon" src='/icon/wc.png' /> 
            <button style={{width: '170px'}} onClick={()=>this.onWallectConnect()}>Wallet Connect</button>
          </div> */}
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.setState({alert: ''})}/>
      </div>
    )
  }
}

export default LoginModal;