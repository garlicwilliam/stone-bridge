import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick, StyleMerger } from '../../../../../util/string';
import { PageTitle } from '../../common/page-title';
import { FixPadding } from '../../../../common/content/fix-padding';
import styles from './standard-deposit.module.less';
import { SldDecimal } from '../../../../../util/decimal';
import { StoneInput } from '../../common/stone-input';
import { walletState } from '../../../../../state-manager/wallet/wallet-state';
import { Network, NETWORKS_ETH, NETWORKS_MANTA } from '../../../../../constant/network';
import { S } from '../../../../../state-manager/contract/contract-state-parser';
import { SldButton } from '../../../../common/buttons/sld-button';
import { I18n } from '../../../../i18n/i18n';
import { combineLatest, Observable, of, Subject, switchMap } from 'rxjs';
import { StoneBridgeType } from '../../../../../state-manager/state-types';
import { mantaBridgeService } from '../../../service/manta-bridge.service';
import { CrossChainMessenger } from '@eth-optimism/sdk';
import { SourceNetwork } from '../../../const/const-var';
import { Contract } from 'ethers';
import { stoneContracts } from '../../../contract/stone-contract';
import { startWith } from 'rxjs/operators';
import { isInNetworkGroup } from '../../../../../constant/network-util';
import { erc20ApprovedAmountGetter } from '../../../../../state-manager/contract/contract-getter-sim-erc20';
import { Visible } from '../../../../builtin/hidden';
import { NetworkLabels } from '../../../../../constant/network-conf';

const APPROVE_LESS = Symbol('MAX');
type ApprovedType = SldDecimal | typeof APPROVE_LESS;

type IState = {
  isMobile: boolean;
  inputStone: SldDecimal | null;
  stoneBalance: SldDecimal;
  isConnected: boolean;
  curNetwork: Network | null;
  isError: boolean;

  mantaL1Approved: ApprovedType;
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

export class StandardDeposit extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    inputStone: null,
    stoneBalance: SldDecimal.ZERO,
    isConnected: false,
    curNetwork: null,
    isError: false,

    mantaL1Approved: SldDecimal.ZERO,
  };

  // standard bridge need approve
  private refreshApproved: Subject<boolean> = new Subject<boolean>();

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('isConnected', walletState.IS_CONNECTED);
    this.registerObservable('curNetwork', walletState.NETWORK);
    this.registerState('stoneBalance', S.Stone.BridgeStandardBalance);

    this.registerObservable('mantaL1Approved', this.mergeMantaL1Approved());
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private mergeMantaL1Approved(): Observable<ApprovedType> {
    const network$: Observable<Network> = walletState.NETWORK;
    const stoneContract$: Observable<Contract | null> = stoneContracts.STANDARD_BRIDGE_STONE_CONTRACT;
    const userAddress$: Observable<string> = walletState.USER_ADDR;
    const approvedEvent$: Observable<boolean> = this.refreshApproved.pipe(startWith(true));

    const bridgeAddress: string = mantaBridgeService.getEthBridgeAddress();
    type CombineLatestRs = [Network, Contract | null, string, boolean];

    return combineLatest([network$, stoneContract$, userAddress$, approvedEvent$]).pipe(
      switchMap(([network, stoneContract, userAddress, __]: CombineLatestRs): Observable<ApprovedType> => {
        if (stoneContract && isInNetworkGroup(network, NETWORKS_ETH)) {
          return erc20ApprovedAmountGetter(userAddress, stoneContract, bridgeAddress);
        } else {
          return of(APPROVE_LESS);
        }
      })
    );
  }

  private doApproveL1() {
    if (!this.state.inputStone) {
      return;
    }

    this.subOnce(mantaBridgeService.approve(this.state.inputStone), done => {
      if (done) {
        this.refreshApproved.next(true);
      }
    });
  }

  onChange(val: SldDecimal | null) {
    this.updateState({ inputStone: val });
  }

  onSend() {
    if (!this.state.inputStone) {
      return;
    }

    if (isInNetworkGroup(this.state.curNetwork, NETWORKS_ETH)) {
      return this.onBridgeToManta(this.state.inputStone);
    }

    if (isInNetworkGroup(this.state.curNetwork, NETWORKS_MANTA)) {
      return this.onBridgeFromManta(this.state.inputStone);
    }
  }

  /**
   * withdraw from l2 to l1
   * @param amount
   * @private
   */
  private onBridgeFromManta(amount: SldDecimal) {
    const bridge$: Observable<string> = mantaBridgeService.getCrossMessenger().pipe(
      switchMap((messenger: CrossChainMessenger) => {
        return mantaBridgeService.bridgeFromManta(messenger, amount);
      })
    );

    const targetNetwork: Network = SourceNetwork[0];
    const srcNetwork: Network = this.state.curNetwork!;

    this.props.onSubmit(bridge$, targetNetwork, srcNetwork, amount, 'standard');
  }

  /**
   * deposit from l1 to l2
   * @param amount
   * @private
   */
  private onBridgeToManta(amount: SldDecimal) {
    const bridge$: Observable<string> = mantaBridgeService.getCrossMessenger().pipe(
      switchMap((messenger: CrossChainMessenger) => {
        return mantaBridgeService.bridgeToManta(messenger, amount);
      })
    );

    const targetNetwork: Network = mantaBridgeService.getL2Network();
    const srcNetwork: Network = this.state.curNetwork!;

    this.props.onSubmit(bridge$, targetNetwork, srcNetwork, amount, 'standard');
  }

  private needApprove(): boolean {
    return (
      !!this.state.inputStone &&
      this.state.mantaL1Approved !== APPROVE_LESS &&
      this.state.mantaL1Approved.lt(this.state.inputStone)
    );
  }

  private targetNetwork(): Network {
    return mantaBridgeService.getTargetNetwork();
  }

  render() {
    const mobileCss: string = this.state.isMobile ? styles.mobile : '';
    const styleMr: StyleMerger = bindStyleMerger(mobileCss);

    const disabled: boolean = !this.state.inputStone?.gtZero() || this.state.isError;
    const needApprove: boolean = this.needApprove();
    const targetNet: string = NetworkLabels[this.targetNetwork()];

    return (
      <div>
        <FixPadding top={60} bottom={0} mobTop={40} mobBottom={0}>
          <PageTitle title={'Send To ' + targetNet} subTitle={'Official Bridge'} />
        </FixPadding>

        <div className={styleMr(styles.wrapperDeposit)}>
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

          <Visible when={needApprove}>
            <SldButton
              size={this.state.isMobile ? 'large' : 'huge'}
              type={'none'}
              className={styleMr(styles.btn)}
              onClick={this.doApproveL1.bind(this)}
            >
              <I18n id={'stone-approve'} textUpper={'uppercase'} />
            </SldButton>
          </Visible>

          <Visible when={!needApprove}>
            <SldButton
              size={this.state.isMobile ? 'large' : 'huge'}
              type={'none'}
              className={styleMr(styles.btn, cssPick(disabled, styles.disabled))}
              disabled={disabled}
              onClick={this.onSend.bind(this)}
            >
              <I18n id={'stone-bridge-send'} textUpper={'uppercase'} />
            </SldButton>
          </Visible>
        </div>
      </div>
    );
  }
}
