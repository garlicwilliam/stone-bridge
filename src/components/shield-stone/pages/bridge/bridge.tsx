import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, StyleMerger } from '../../../../util/string';
import styles from './bridge.module.less';
import { PageTitle } from '../common/page-title';
import { BridgeCard } from './card/bridge-card';
import { Visible } from '../../../builtin/hidden';
import { BridgeStep } from './card/bridge-step';
import { C } from '../../../../state-manager/cache/cache-state-parser';
import { finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { asyncScheduler, combineLatest, Observable, of, Subject } from 'rxjs';
import { Network, NETWORKS_ETH, NETWORKS_MANTA } from '../../../../constant/network';
import { StoneBridgeCrossCache, StoneBridgeType } from '../../../../state-manager/state-types';
import { SldDecimal } from '../../../../util/decimal';
import { mantaBridgeService } from '../../service/manta-bridge.service';
import { walletState } from '../../../../state-manager/wallet/wallet-state';
import { isInNetworkGroup } from '../../../../constant/network-util';
import { TokenBridgeMessage } from '@eth-optimism/sdk';
import { StandardWithdraw } from './card/standard-withdraw';
import { StandardDeposit } from './card/standard-deposit';
import lz from '../../../../assets/imgs/stone/layer-zero.svg';

type IState = {
  isMobile: boolean;
  curTxHash: StoneBridgeCrossCache | undefined; // submit
  curParam: StoneBridgeCrossCache | undefined;
  curSubmit: boolean;
  curNetwork: Network | null;

  mantaProcessMessages: TokenBridgeMessage[];
  isProcessMessagesLoading: boolean;
};
type IProps = {};

export class Bridge extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    curTxHash: undefined,
    curParam: undefined,
    curSubmit: false,
    curNetwork: null,

    mantaProcessMessages: [],
    isProcessMessagesLoading: false,
  };

  private withdrawRefresh: Subject<boolean> = new Subject<boolean>();

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('curTxHash', this.mergeTx());
    this.registerObservable('curNetwork', walletState.NETWORK);
    this.registerObservable('mantaProcessMessages', this.mergeProcessMessages());
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private mergeProcessMessages(): Observable<TokenBridgeMessage[]> {
    const network$: Observable<Network> = walletState.NETWORK;
    const trigger$: Observable<boolean> = this.withdrawRefresh.pipe(startWith(true));
    const user$: Observable<string> = walletState.USER_ADDR;

    return combineLatest([network$, user$, trigger$]).pipe(
      switchMap(([network, user, trigger]) => {
        if (!isInNetworkGroup(network, NETWORKS_ETH)) {
          return of([]);
        }

        return of(true).pipe(
          tap(() => {
            asyncScheduler.schedule(() => {
              this.updateState({ isProcessMessagesLoading: true });
            });
          }),
          switchMap(() => {
            return mantaBridgeService.getWithdraws();
          }),
          finalize(() => {
            asyncScheduler.schedule(() => {
              this.updateState({ isProcessMessagesLoading: false });
            });
          })
        );
      })
    );
  }

  private mergeTx(): Observable<StoneBridgeCrossCache | undefined> {
    return C.Stone.Bridge.Tx.watch().pipe(
      map((val: null | StoneBridgeCrossCache) => {
        return val || undefined;
      })
    );
  }

  private onFormDone(
    tx$: Observable<string>,
    targetNet: Network,
    srcNet: Network,
    amount: SldDecimal,
    bridgeType: StoneBridgeType
  ) {
    this.updateState({
      curSubmit: true,
      curParam: { txHash: '', srcNetwork: srcNet, disNetwork: targetNet, amount: amount.toJson(), bridgeType },
    });

    this.subOnce(tx$, (txHash: string) => {
      if (txHash) {
        P.Stone.BridgeCross.StoneAmount.set(null);
        const val: StoneBridgeCrossCache = {
          bridgeType,
          txHash,
          srcNetwork: srcNet,
          disNetwork: targetNet,
          amount: amount.toJson(),
        };
        C.Stone.Bridge.Tx.set(val);
      }

      this.updateState({ curSubmit: false });
    });
  }

  private onStepReset() {
    C.Stone.Bridge.Tx.set(null);
  }

  render() {
    const mobileCss: string = this.state.isMobile ? styles.mobile : '';
    const styleMr: StyleMerger = bindStyleMerger(mobileCss);

    const isShowStep: boolean = !!this.state.curTxHash || this.state.curSubmit;

    return (
      <div className={styleMr(styles.wrapperBridge)}>
        <PageTitle title={'STONE Bridge'} />

        <Visible when={!isShowStep}>
          <BridgeCard onSubmit={this.onFormDone.bind(this)} />
        </Visible>

        <Visible when={isShowStep}>
          <BridgeStep
            submit={this.state.curSubmit}
            params={this.state.curParam}
            txHash={this.state.curTxHash}
            onReset={() => this.onStepReset()}
          />
        </Visible>

        <div className={styleMr(styles.power)}>
          Powered by &nbsp; <img src={lz} alt={''} height={24} />
        </div>

        {/*<Visible when={!isShowStep}>*/}
        {/*  <Visible when={isInNetworkGroup(this.state.curNetwork, NETWORKS_ETH)}>*/}
        {/*    <StandardWithdraw />*/}
        {/*  </Visible>*/}

        {/*  <Visible*/}
        {/*    when={*/}
        {/*      isInNetworkGroup(this.state.curNetwork, NETWORKS_MANTA)*/}
        {/*      //|| isInNetworkGroup(this.state.curNetwork, NETWORKS_ETH)*/}
        {/*    }*/}
        {/*  >*/}
        {/*    <StandardDeposit onSubmit={this.onFormDone.bind(this)} />*/}
        {/*  </Visible>*/}
        {/*</Visible>*/}
      </div>
    );
  }
}
