import { Server } from './server';
import { Service } from './service';

export class AccountService extends Service {

  isLoggedIn():boolean {
    if (Server.account.isMetamaskLoggedIn())
      return true;
    else
      if (Server.provider)
        return (Server.provider.accounts.length > 0);
      else
        return false;
  }

  isMetamaskLoggedIn():boolean {
    return (localStorage.getItem('metamask') != null);
  }

  getWallet(): string {
    if (Server.account.isMetamaskLoggedIn())
      return this.getMetamaskAccount();
    else
      if (this.isLoggedIn())
        return Server.provider.accounts[0];
      else
        return '';
  }

  getMetamaskAccount(): string {
    return localStorage.getItem('metamask');
  }

  async getBalance(address: string) {
    const balance = await Server.web3.eth.getBalance(address);
    return balance;
  }
}