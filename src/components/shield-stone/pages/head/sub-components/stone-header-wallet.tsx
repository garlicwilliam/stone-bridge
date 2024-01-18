import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../../util/string';
import styles from './stone-header-wallet.module.less';
import { Network } from '../../../../../constant/network';
import { walletState } from '../../../../../state-manager/wallet/wallet-state';
import { Visible } from '../../../../builtin/hidden';
import { HeadNetworkSwitch } from '../../common/network-switch';
import { ConnectWallet } from '../../../../header-wallet/sub-components/connect-wallet';
import { WalletAddress } from '../../../../header-wallet/sub-components/wallet-address';
import { supportNets } from '../../../routers/router-utils';
import { EmptyProps, LocationProps, withLocation } from '../../../../common/utils/location-wrapper';
import {StoneColorType} from "../../../../../state-manager/state-types";

type IState = {
  isMobile: boolean;
  isConnected: boolean;
  curNetwork: Network | undefined;
  colorType: StoneColorType;
};
type IProps = EmptyProps & LocationProps;

export class StoneHeaderWalletImp extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    isConnected: false,
    curNetwork: undefined,
    colorType: P.Stone.ColorType.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('isConnected', walletState.IS_CONNECTED);
    this.registerObservable('curNetwork', walletState.NETWORK);
    this.registerState('colorType', P.Stone.ColorType);
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private genColorCss(): string {
    return this.state.colorType === StoneColorType.Color1 ? styles.color1 : styles.color2;
  }

  render() {
    const mobileCss: string = this.state.isMobile ? styles.mobile : '';
    const colorCss: string = this.genColorCss();
    const styleMr = bindStyleMerger(mobileCss);
    const nets: Network[] = supportNets(this.props.location);

    return (
      <div className={styleMr(styles.wrapperWallet)}>
        <Visible when={this.state.isConnected}>
          <WalletAddress className={styleMr(styles.walletAddress, colorCss)} />

          <HeadNetworkSwitch
            current={this.state.curNetwork}
            supports={nets}
            className={styleMr(styles.networkSwitch, colorCss)}
            selectClassName={styleMr(styles.networkSelect, colorCss)}
            dropdownClassName={styleMr(styles.networkSelectDropdown)}
          />
        </Visible>

        <Visible when={!this.state.isConnected}>
          <ConnectWallet />
        </Visible>
      </div>
    );
  }
}

export const StoneHeaderWallet = withLocation(StoneHeaderWalletImp);
