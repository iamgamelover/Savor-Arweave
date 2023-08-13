import React from 'react';
import { getAssetImage } from '../util/util';
import './ShopCard.css'
import { AppConfig } from '../AppConfig';

interface ShopCardProps {
  metadata: any;
  onPurchase: Function;
}

interface ShopCardState {
  showPurchase: boolean;
}

class ShopCard extends React.Component<ShopCardProps, ShopCardState> {
  protected tokensPerDollar:number = 100;

  constructor(props: ShopCardProps) {
    super(props);
    this.state = {
      showPurchase: false,
    };

    this.onStartPurchase = this.onStartPurchase.bind(this);
    this.onPurchase = this.onPurchase.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onStartPurchase() {
    this.setState({showPurchase: true});
  }

  onPurchase() {
    this.setState({showPurchase: false});
    this.props.onPurchase();
  }

  onCancel() {
    this.setState({showPurchase: false});
  }

  renderPriceDiv(price:number, currency:string, includeUsd:boolean=false) {
    if(currency == 'usd') {
      return (
        <div className="shop-card-price">
          ${price.toFixed(2)}
        </div>
      )
    }

    let icon = (currency == 'coin') ? 'coin' : AppConfig.token.id;
    let iconSrc = '/' + icon + '.png';

    let priceStr = price.toFixed(0);

    if(currency == 'usd')
      priceStr = (price * this.tokensPerDollar).toFixed(0);

    let usd = null;
    if(currency != 'coin' && includeUsd) {
      let usdValue = (currency == 'usd') ? price : (price / this.tokensPerDollar);
      let decimalPlaces = usdValue < 1 ? 2 : 0;
      usd = <span className="shop-card-price-usd">&nbsp;(${usdValue.toFixed(decimalPlaces)})</span>
    }

    return (
      <div className="shop-card-price">
        {priceStr}&nbsp;<img className="shop-card-price-icon" src={iconSrc} />{usd}
      </div>
    )
  }

  render() {
    let data = this.props.metadata;
    let image = getAssetImage(data);
    let imageClass = (data.category == 'banner') ? 'shop-card-image-banner' : 'shop-card-image';

    return (
      <div className="shop-card">
        <div className="shop-card-header">{data.name}</div>

        <div className="shop-card-image-container" onClick={() => this.onStartPurchase()}>
          <img className={imageClass} src={data.image} alt=''></img>
        </div>

        <div className="shop-card-footer">
          <div className="shop-card-buy-button" onClick={() => this.onStartPurchase()}>
            {this.renderPriceDiv(data.price, data.currency, true)}
          </div>
        </div>

        {/* <PurchaseAssetModal 
          show={this.state.showPurchase} 
          asset={this.props.metadata.id} 
          onPurchase={this.onPurchase} 
          onCancel={this.onCancel} 
        /> */}
      </div>
    );
  }
}

export default ShopCard;
