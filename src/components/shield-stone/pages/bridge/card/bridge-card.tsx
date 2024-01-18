import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick } from '../../../../../util/string';
import styles from './bridge-card.module.less';
import { StoneInput } from '../../common/stone-input';
import { SldDecimal } from '../../../../../util/decimal';
import { S } from '../../../../../state-manager/contract/contract-state-parser';
import { ItemsBox } from '../../../../common/content/items-box';
import { SldSelect, SldSelectOption } from '../../../../common/selects/select';
import { Network, NETWORKS_ETH, NETWORKS_MANTA } from '../../../../../constant/network';
import { walletState } from '../../../../../state-manager/wallet/wallet-state';
import { CrossChainIdMap } from '../../../const/bridge';
import { NetworkCurrency, NetworkIcons, NetworkNames } from '../../../../../constant/network-conf';
import { Observable, combineLatest, switchMap, from, of, zip, Subject } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { SldButton } from '../../../../common/buttons/sld-button';
import { HorizonItem } from '../../../../common/content/horizon-item';
import { I18n } from '../../../../i18n/i18n';
import arrowDown from '../../../../../assets/imgs/stone/arrow-down.svg';
import { stoneBridgeTo } from '../../../service/stone.service';
import { Visible } from '../../../../builtin/hidden';
import { ConnectWalletBtn } from '../../common/connect-wallet-btn';
import { CrossNetworks, SourceNetwork } from '../../../const/const-var';
import { StoneBridgeCrossCapacity, StoneBridgeType } from '../../../../../state-manager/state-types';
import { isInNetworkGroup } from '../../../../../constant/network-util';
import { mantaBridgeService } from '../../../service/manta-bridge.service';
import { CrossChainMessenger } from '@eth-optimism/sdk';
import { stoneContracts } from '../../../contract/stone-contract';
import { erc20ApprovedAmountGetter } from '../../../../../state-manager/contract/contract-getter-sim-erc20';
import { Contract } from 'ethers';
import { TokenAmountInline } from '../../../../common/content/token-amount-inline';
import { TOKEN_SYMBOL } from '../../../../../constant/tokens';

type IState = {
  isMobile: boolean;
  isTestLocal: boolean;
  stoneBalance: SldDecimal;
  nativeBalance: SldDecimal;
  curNetwork: Network | null;
  userAddress: string;
  options: SldSelectOption[];
  inputStone: SldDecimal | null;
  curSelected: Network | null;
  fees: { native: SldDecimal; zero: SldDecimal };
  //caps: StoneBridgeCrossCapacity | undefined;
  isError?: boolean;
  isConnected: boolean;
};
type IProps = {
  onSubmit: (
    transaction: Observable<string>,
    targetNet: Network,
    srcNet: Network,
    amount: SldDecimal,
    bridgeType: StoneBridgeType
  ) => void;
};

export class BridgeCard extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    isTestLocal: P.Layout.isLocalTest.get(),
    stoneBalance: SldDecimal.ZERO,
    nativeBalance: SldDecimal.ZERO,
    inputStone: P.Stone.BridgeCross.StoneAmount.get(),
    curNetwork: null,
    userAddress: '',
    options: [],
    curSelected: null,
    fees: { native: SldDecimal.ZERO, zero: SldDecimal.ZERO },
    //caps: undefined,
    isError: false,
    isConnected: false,
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerState('isTestLocal', P.Layout.isLocalTest);
    this.registerState('stoneBalance', S.Stone.StoneUserBalance);
    this.registerObservable('nativeBalance', walletState.NATIVE_BALANCE);
    this.registerObservable('curNetwork', walletState.NETWORK);
    this.registerObservable('userAddress', walletState.USER_ADDR);
    this.registerObservable('options', this.mergeOptions());
    this.registerObservable('isConnected', walletState.IS_CONNECTED);
    this.registerState('inputStone', P.Stone.BridgeCross.StoneAmount);
    this.registerState('curSelected', P.Stone.BridgeCross.TargetNetwork);
    this.registerState('fees', S.Stone.BridgeCrossFee);
    //this.registerState('caps', S.Stone.BridgeCrossCap);
  }

  componentWillUnmount() {
    this.destroyState();
  }

  // standard bridge need approve
  private refreshApproved: Subject<boolean> = new Subject<boolean>();

  onChange(val: SldDecimal | null) {
    P.Stone.BridgeCross.StoneAmount.set(val);
  }

  onSelect(val: Network | null) {
    P.Stone.BridgeCross.TargetNetwork.set(val);
  }

  private onBridge() {
    if (!this.state.inputStone || this.state.inputStone.isZero() || !this.state.curSelected || !this.state.curNetwork) {
      return;
    }

    // if (isInNetworkGroup(this.state.curSelected, NETWORKS_MANTA)) {
    //   this.onBridgeToManta(this.state.inputStone);
    //   return;
    // }
    //
    // if (
    //   isInNetworkGroup(this.state.curSelected, NETWORKS_ETH) &&
    //   isInNetworkGroup(this.state.curNetwork, NETWORKS_MANTA)
    // ) {
    //   this.onBridgeFromManta(this.state.inputStone);
    //   return;
    // }

    const chainId: number = CrossChainIdMap[this.state.curSelected];
    const amount: SldDecimal = this.state.inputStone;
    const srcNetwork: Network = this.state.curNetwork;
    const targetNetwork: Network = this.state.curSelected;
    const userAddress: string = this.state.userAddress;
    const fees: SldDecimal = this.state.fees.native;

    const bridge$: Observable<string> = stoneBridgeTo(chainId, userAddress, amount, fees);

    this.props.onSubmit(bridge$, targetNetwork, srcNetwork, amount, 'layerZero');
  }

  private mergeOptions(): Observable<SldSelectOption[]> {
    return combineLatest([this.watchStateChange('isMobile'), this.watchStateChange('curNetwork')]).pipe(
      map(([_, curNet]) => curNet),
      filter(Boolean),
      map((network: Network) => {
        return this.genOptions(network);
      })
    );
  }

  private genOptions(curNetwork: Network): SldSelectOption[] {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const optionNetworks: Network[] = CrossNetworks.filter((one: Network) => one !== curNetwork);

    return optionNetworks.map((net: Network): SldSelectOption => {
      return {
        value: net,
        label: (
          <div className={styleMr(styles.optionContent)}>
            <div className={styleMr(styles.icon)}>
              <img src={NetworkIcons[net]} alt={''} width={this.state.isMobile ? 28 : 36} />
            </div>
            <div className={styleMr(styles.text)}>{NetworkNames[net]}</div>
          </div>
        ),
      };
    });
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);
    const isFeeEnough: boolean = this.state.nativeBalance.gte(this.state.fees.native);

    return (
      <div className={styleMr(styles.wrapperCard)}>
        <ItemsBox gap={this.state.isMobile ? 20 : 30} align={'center'}>
          <div>
            <StoneInput
              max={this.state.stoneBalance}
              maxBalance={this.state.stoneBalance}
              className={styleMr(styles.inputBg)}
              onChange={this.onChange.bind(this)}
              value={this.state.inputStone}
              onError={isError => this.updateState({ isError })}
              disabled={!this.state.isConnected}
              curNetwork={this.state.curNetwork}
            />

            <div className={styleMr(styles.bridgeTo)}>
              <img
                src={arrowDown}
                alt={''}
                width={this.state.isMobile ? 22 : 24}
                height={this.state.isMobile ? 22 : 24}
              />
            </div>

            <SldSelect
              noBorder={true}
              className={styleMr(styles.selectNet)}
              dropdownClassName={styleMr(styles.optionOverlay)}
              options={this.state.options}
              offset={4}
              curSelected={this.state.curSelected || undefined}
              onChangeSelect={(op: SldSelectOption) => this.onSelect(op.value as Network)}
              emptyReplace={<div className={styleMr(styles.selectReplace)}>Select Target Network</div>}
              noMatchReplace={<div className={styleMr(styles.selectReplace)}>Select Target Network</div>}
              isDisabled={!this.state.isConnected}
            />
          </div>

          <div className={styleMr(styles.paramLight)}>
            <HorizonItem
              label={<I18n id={'stone-fees'} />}
              align={'justify'}
              labelClass={styleMr(styles.label)}
              valueClass={styleMr(styles.value, cssPick(!isFeeEnough, styles.notEnough))}
            >
              {this.state.fees.native.format({ fix: 8, ceil: true })}{' '}
              {this.state.curNetwork ? NetworkCurrency[this.state.curNetwork] : ''}
              <Visible when={!isFeeEnough}>
                &nbsp;( <I18n id={'stone-fee-not-enough'} /> )
              </Visible>
            </HorizonItem>

            {/*<Visible when={this.state.isTestLocal}>*/}
            {/*  <HorizonItem*/}
            {/*    label={<I18n id={'stone-bridge-capacity'} />}*/}
            {/*    align={'justify'}*/}
            {/*    labelClass={styleMr(styles.label)}*/}
            {/*    valueClass={styleMr(styles.value)}*/}
            {/*  >*/}
            {/*    <TokenAmountInline*/}
            {/*      maxDisplay={SldDecimal.fromNumeric('1000000', 18)}*/}
            {/*      amount={this.state.caps?.remain}*/}
            {/*      token={TOKEN_SYMBOL.STONE}*/}
            {/*    />*/}
            {/*  </HorizonItem>*/}
            {/*</Visible>*/}
          </div>

          <Visible when={this.state.isConnected}>
            <SldButton
              size={this.state.isMobile ? 'large' : 'huge'}
              type={'none'}
              className={styleMr(styles.btn, cssPick(this.state.isError || !isFeeEnough, styles.disabled))}
              onClick={() => this.onBridge()}
              disabled={this.state.isError || !isFeeEnough}
            >
              <I18n id={'stone-bridge-send'} textUpper={'uppercase'} />
            </SldButton>
          </Visible>

          <Visible when={!this.state.isConnected}>
            <ConnectWalletBtn />
          </Visible>
        </ItemsBox>
      </div>
    );
  }
}
