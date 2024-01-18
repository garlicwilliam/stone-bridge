import { BaseStateComponent } from '../../state-manager/base-state-component';
import { SelectButton } from '../common/buttons/select-btn';
import { Wallet } from '../../constant';
import { combineLatest, Observable } from 'rxjs';
import { walletState } from '../../state-manager/wallet/wallet-state';
import { map, take, tap } from 'rxjs/operators';
import walletConnect from '../../assets/imgs/wallet/wallet-connect.svg';
import { i18n } from '../i18n/i18n-fn';
import { WalletButtonStyleType } from './common-types';
import { ReactNode } from 'react';
import { cssPick } from '../../util/string';
import { fontCss } from '../i18n/font-switch';
import { WalletInterface } from '../../wallet/wallet-interface';

type IProps = {
  onClick?: (wallet: Wallet) => void;
  styleType?: WalletButtonStyleType;
  disabled?: boolean;
};
type IState = {
  isWalletConnectActivate: boolean;
  isWalletConnectSelected: boolean;
  peerName?: string;
};

export class WalletConnectButton extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isWalletConnectActivate: false,
    isWalletConnectSelected: false,
    peerName: undefined,
  };

  componentDidMount() {
    this.registerObservable('isWalletConnectActivate', this.mergeWalletConnectActive());
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private mergeWalletConnectActive(): Observable<boolean> {
    return combineLatest([walletState.WALLET_TYPE, walletState.IS_CONNECTED]).pipe(
      map(([wallet, isConnected]) => {
        return wallet === Wallet.WalletConnect && isConnected;
      }),
      tap((isActive: boolean) => {
        if (isActive) {
          const name$ = walletState
            .watchWalletInstance()
            .pipe(
              take(1),
              map((wallet: WalletInterface) => {
                return wallet.walletName();
              })
            )
            .subscribe(peerName => {
              this.updateState({ peerName });
            });
        }
      })
    );
  }

  onClickBtn() {
    walletState.connectToWallet(Wallet.WalletConnect);
  }

  private genIcon(): ReactNode {
    return (
      <div
        style={{
          lineHeight: '0px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img alt={''} src={walletConnect} style={{ maxWidth: '20px', maxHeight: '20px' }} />
      </div>
    );
  }

  private genBtnIcon(): ReactNode {
    return (
      <div
        style={{
          lineHeight: '0px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img alt={''} src={walletConnect} style={{ maxWidth: '32px', maxHeight: '32px', borderRadius: '4px' }} />
      </div>
    );
  }

  render() {
    const stateAppend: string = this.state.peerName ? this.state.peerName : i18n('com-connected');
    const connectedState: string = this.state.isWalletConnectActivate ? ` (${stateAppend})` : '';

    return (
      <>
        <SelectButton
          isActivate={this.state.isWalletConnectActivate}
          isSelected={this.state.isWalletConnectSelected}
          onClick={this.onClickBtn.bind(this)}
          styleType={this.props.styleType}
          disabled={this.props.disabled}
        >
          <div>{this.props.styleType === 'popup' ? this.genBtnIcon() : this.genIcon()}</div>
          <span className={cssPick(this.props.styleType === 'popup', fontCss.bold)}>
            WalletConnect {connectedState}
          </span>
        </SelectButton>
      </>
    );
  }
}
