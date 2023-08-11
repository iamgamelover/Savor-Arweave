import React from 'react';
import ShopCard from '../elements/ShopCard';
import './ShopPage.css'
import { Server } from '../../server/server';
import { Navigate } from 'react-router-dom';

interface ShopPageState {
  category: string;
}

class ShopPage extends React.Component<{}, ShopPageState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      category: 'all'
    };

    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onPurchase = this.onPurchase.bind(this);
  }

  onCategoryChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({category: element.value});
  }

  onPurchase() {
    this.forceUpdate();
  }

  render() {
    if (!Server.account.isLoggedIn())
      return <Navigate to="/" replace />;

    // let assets = Server.shop.getAssetsByTypeAndCategory('pack', this.state.category);

    let assets = [
      {
        name: 'Bread',
        image: '/icon/bread.png',
        currency: 'coin',
        price: 6,
        category: 'food',
      },
      {
        name: 'Jacket',
        image: '/icon/jacket.png',
        currency: 'coin',
        price: 50,
        category: 'clothes',
      },
    ];

    let cards = [];
    for (let i = 0; i < assets.length; i++) 
      cards.push(<ShopCard key={i} metadata={assets[i]} onPurchase={this.onPurchase} />)

    // let tokenAsset = Database.getAsset(AppConfig.token.id);
    // let coinAsset = Database.getAsset(AppConfig.coin.id);
    
    return (
      <div className="shop-page">
        <div className="shop-page-header">
          <div className="shop-page-filter-panel">
            <select style={{width: '100%'}} value={this.state.category} onChange={this.onCategoryChange}>
              <option value="all">All</option>
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
            </select>
          </div>

          <div style={{display: 'flex'}}>
            {/* <div className="shop-currency-header">
              <div>{Server.user.getTokenCount()}</div>
              <img className="shop-currency-icon" src={getAssetImage(tokenAsset)} />
            </div> */}

            <div className="shop-currency-header">
              <div>{'100'}</div>
              <img className="shop-currency-icon" src='/icon/coin.png' />
            </div>
          </div>
        </div>

        <div className="shop-card-container">
          {cards.length > 0 ? cards : 'No asset in the shop.'}
        </div>
      </div>
    );
  }
}

export default ShopPage;
