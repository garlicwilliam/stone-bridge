import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './footer-mobile.module.less';
import { walletState } from '../../../../state-manager/wallet/wallet-state';
import { Network } from '../../../../constant/network';
import { shortAddress } from '../../../../util';
import { SldButton } from '../../../common/buttons/sld-button';
import { HeadNetworkSwitch } from '../common/network-switch';
import { supportNets } from '../../routers/router-utils';
import { EmptyProps, LocationProps, withLocation } from '../../../common/utils/location-wrapper';
import { Visible } from '../../../builtin/hidden';
import { ConnectWallet } from '../../../header-wallet/sub-components/connect-wallet';

type IState = {
  isMobile: boolean;
  userAddress: string | null;
  network?: Network;
  isConnected: boolean;
};
type IProps = EmptyProps & LocationProps;

export class FooterMobileImp extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    userAddress: null,
    network: undefined,
    isConnected: false,
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('userAddress', walletState.USER_ADDR);
    this.registerObservable('network', walletState.NETWORK);
    this.registerObservable('isConnected', walletState.IS_CONNECTED);
  }

  componentWillUnmount() {
    this.destroyState();
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);
    const nets: Network[] = supportNets(this.props.location);

    return (
      <div className={styleMr(styles.wrapperFooter)}>
        <Visible when={this.state.isConnected}>
          <SldButton
            size={'small'}
            type={'none'}
            className={styleMr(styles.addressBtn)}
            onClick={() => {
              P.Layout.IsShowWalletModal.set(true);
            }}
          >
            <div className={styleMr()}>{shortAddress(this.state.userAddress)}</div>
          </SldButton>
        </Visible>

        <Visible when={!this.state.isConnected}>
          <div />
          <ConnectWallet />
        </Visible>

        <Visible when={this.state.isConnected}>
          <HeadNetworkSwitch
            supports={nets}
            current={this.state.network}
            className={styleMr(styles.networkSwitch)}
            selectClassName={styleMr(styles.networkSwitchSelect)}
            dropdownClassName={styleMr(styles.networkSwitchSelectDropdown)}
          />
        </Visible>
      </div>
    );
  }
}

export const FooterMobile = withLocation(FooterMobileImp);
