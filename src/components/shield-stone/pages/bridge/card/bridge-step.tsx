import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick } from '../../../../../util/string';
import styles from './bridge-step.module.less';
import { Message, MessageStatus } from '@layerzerolabs/scan-client';
import { Observable, switchMap, combineLatest, interval, Subject, asyncScheduler } from 'rxjs';
import { getLayerZeroBridgeMessages, getStandardBridgeMessage } from '../../../utils/bridge';
import { Network } from '../../../../../constant/network';
import { walletState } from '../../../../../state-manager/wallet/wallet-state';
import { filter, finalize, startWith } from 'rxjs/operators';
import { NetworkIcons, NetworkNames } from '../../../../../constant/network-conf';
import { CrossChainIdToNet } from '../../../const/bridge';
import arrow from '../../../../../assets/imgs/stone/arrow-down2.svg';
import { SldButton } from '../../../../common/buttons/sld-button';
import { Visible } from '../../../../builtin/hidden';
import { StoneBridgeCrossCache } from '../../../../../state-manager/state-types';
import { SldDecimal } from '../../../../../util/decimal';
import { TOKEN_SYMBOL } from '../../../../../constant/tokens';
import { CheckOutlined, SwapOutlined } from '@ant-design/icons';
import { I18n } from '../../../../i18n/i18n';
import * as _ from 'lodash';

import { mantaBridgeService } from '../../../service/manta-bridge.service';
import { CrossChainMessage, MessageStatus as StandardMessageStatus } from '@eth-optimism/sdk';
import { SourceNetwork } from '../../../const/const-var';

type IState = {
  isMobile: boolean;
  txHash: StoneBridgeCrossCache | null;
  network: Network | null;
  isConnected: boolean;

  layerZeroMessage: Message | null;
  standardMessage: CrossChainMessage | null;
};

type IProps = {
  onReset?: () => void;
  txHash?: StoneBridgeCrossCache;
  submit: boolean;
  params?: StoneBridgeCrossCache;
};

type BridgeStatus = {
  isSubmitting: boolean;
  isSubmitSuc: boolean;
  isPending: boolean;
  isDone: boolean;
  isFailed: boolean;
  isNetDone: boolean;
};

export class BridgeStep extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    layerZeroMessage: null,
    standardMessage: null,
    txHash: null,
    network: null,
    isConnected: false,
  };

  messageGetEvent: Subject<boolean> = new Subject<boolean>();

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('network', walletState.NETWORK);
    this.registerObservable('layerZeroMessage', this.mergeLayerZeroMessage());
    this.registerObservable('standardMessage', this.mergeStandardMessage());
    this.registerObservable('isConnected', walletState.IS_CONNECTED);

    if (this.props.txHash) {
      this.updateState({ txHash: this.props.txHash });
    }
  }

  componentWillUnmount() {
    this.destroyState();
  }

  componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any) {
    if (prevProps.txHash !== this.props.txHash) {
      this.updateState({ txHash: this.props.txHash });
    }
  }

  mergeLayerZeroMessage(): Observable<Message | null> {
    return combineLatest([
      this.watchStateChange('network').pipe(filter(Boolean)),
      this.watchStateChange('txHash').pipe(filter(Boolean)),
      interval(3000),
    ]).pipe(
      switchMap(([network, txHash, _]) => {
        return getLayerZeroBridgeMessages(network, txHash.txHash);
      })
    );
  }

  mergeStandardMessage(): Observable<CrossChainMessage> {
    return combineLatest([
      this.watchStateChange('txHash').pipe(filter(Boolean)),
      this.watchStateChange('network').pipe(switchMap(() => mantaBridgeService.getCrossMessenger())),
      this.messageGetEvent.pipe(startWith(0)),
    ]).pipe(
      switchMap(([txHash, messenger, _]) => {
        return getStandardBridgeMessage(messenger, txHash.txHash).pipe(
          finalize(() => {
            asyncScheduler.schedule(() => {
              this.messageGetEvent.next(true);
            });
          })
        );
      })
    );
  }

  onSwitchToSource() {
    walletState.switchNetwork(SourceNetwork[0]);
  }

  private messageToTargetNet(message: Message): Network {
    return CrossChainIdToNet[message.dstChainId];
  }

  private isLayerZeroStatus(status: MessageStatus): boolean {
    return this.state.layerZeroMessage?.status === status;
  }

  private isStandardBridge(): boolean {
    return this.props.params?.bridgeType === 'standard' || this.state.txHash?.bridgeType === 'standard';
  }

  private isLayerZeroBridge(): boolean {
    return this.props.params?.bridgeType === 'layerZero' || this.state.txHash?.bridgeType === 'layerZero';
  }

  private isDisabledGoBack(status: BridgeStatus): boolean {
    return (
      (this.isStandardBridge() && status.isSubmitting) ||
      (this.isLayerZeroBridge() && (status.isSubmitting || status.isPending))
    );
  }

  private genNetworkInfo(txParams: StoneBridgeCrossCache | undefined) {
    const srcNet: Network | undefined = this.state.network ? this.state.network : txParams?.srcNetwork;
    const disNet: Network | undefined = this.state.layerZeroMessage
      ? this.messageToTargetNet(this.state.layerZeroMessage)
      : txParams?.disNetwork;
    const srcImg = srcNet ? NetworkIcons[srcNet] : '';
    const dstImg = disNet ? NetworkIcons[disNet] : '';
    const srcName = srcNet ? NetworkNames[srcNet] : '';
    const dstName = disNet ? NetworkNames[disNet] : '';

    return { srcImg, dstImg, srcName, dstName };
  }

  private genLayerZeroStatus(): BridgeStatus {
    const isSubmitting: boolean = this.props.submit && !this.props.txHash;
    const isSubmitSuc: boolean = !this.props.submit && !!this.props.txHash;

    const isDone: boolean = !!this.state.layerZeroMessage && this.isLayerZeroStatus(MessageStatus.DELIVERED);
    const isNetDone: boolean = false;
    const isFailed: boolean = !!this.state.layerZeroMessage && this.isLayerZeroStatus(MessageStatus.FAILED);
    const isPending: boolean =
      (isSubmitSuc && !this.state.layerZeroMessage) || this.isLayerZeroStatus(MessageStatus.INFLIGHT);

    return { isSubmitting, isSubmitSuc, isPending, isDone, isFailed, isNetDone };
  }

  private getStandardBridgeStatus(): BridgeStatus {
    const isSubmitting: boolean = this.props.submit && !this.props.txHash;
    const isSubmitSuc: boolean = !this.props.submit && !!this.props.txHash;
    const messageStatus = _.get(this.state.standardMessage, 'status');

    const isPending: boolean =
      (!messageStatus && isSubmitSuc) ||
      messageStatus === StandardMessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE ||
      messageStatus === StandardMessageStatus.STATE_ROOT_NOT_PUBLISHED;

    const isDone: boolean = messageStatus === StandardMessageStatus.RELAYED;
    const isNetDone: boolean =
      messageStatus === StandardMessageStatus.READY_TO_PROVE ||
      messageStatus === StandardMessageStatus.IN_CHALLENGE_PERIOD ||
      messageStatus === StandardMessageStatus.READY_FOR_RELAY;

    const isFailed: boolean = messageStatus === StandardMessageStatus.FAILED_L1_TO_L2_MESSAGE;

    return { isSubmitting, isSubmitSuc, isPending, isDone, isFailed, isNetDone };
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const txParams: StoneBridgeCrossCache | undefined = this.props.txHash ? this.props.txHash : this.props.params;
    const moveAmount: SldDecimal = txParams ? SldDecimal.fromJson(txParams.amount) : SldDecimal.ZERO;

    const { srcImg, dstImg, srcName, dstName } = this.genNetworkInfo(txParams);

    const status: BridgeStatus =
      txParams?.bridgeType === 'layerZero' ? this.genLayerZeroStatus() : this.getStandardBridgeStatus();

    return (
      <div className={styleMr(styles.wrapperStep)}>
        <div className={styleMr(styles.amount)}>
          <span>Move&nbsp;</span>
          <span className={styleMr(styles.highlightColor)}>
            {moveAmount.format({ fix: 5, removeZero: true })} {TOKEN_SYMBOL.STONE.description}
          </span>
          <span>&nbsp;to {dstName}</span>
        </div>

        <div className={styleMr(styles.steps)}>
          <div className={styleMr(styles.net)}>
            <div
              className={styleMr(
                styles.loader,
                cssPick(status.isSubmitting, styles.pending),
                cssPick(status.isSubmitSuc, styles.finished),
                cssPick(status.isFailed, styles.error)
              )}
            />

            <div className={styleMr(styles.netIcon)}>
              <img src={srcImg} alt={''} />
            </div>

            <Visible when={status.isSubmitSuc}>
              <div className={styleMr(styles.doneSign)}>
                <CheckOutlined />
              </div>
            </Visible>
          </div>

          {/* arrow */}
          <div className={styleMr(styles.arrowIcon)}>
            <img src={arrow} alt={''} />
          </div>

          {/*  */}
          <div className={styleMr(styles.net)}>
            <div
              className={styleMr(
                styles.loader,
                // cssPick(isSubmitting, styles.idle),
                cssPick(status.isPending, styles.pending),
                cssPick(status.isDone || status.isNetDone, styles.finished),
                cssPick(status.isFailed, styles.error)
              )}
            />

            <div className={styleMr(styles.netIcon)}>
              <img src={dstImg} alt={''} />
            </div>

            <Visible
              when={
                this.state.txHash?.bridgeType === 'standard' &&
                _.get(this.state.standardMessage, 'status') === StandardMessageStatus.STATE_ROOT_NOT_PUBLISHED
              }
            >
              <div className={styleMr(styles.pendingState)}>Awaiting State Root</div>
            </Visible>

            <Visible when={status.isDone}>
              <div className={styleMr(styles.doneSign)}>
                <CheckOutlined />
              </div>
            </Visible>

            <Visible when={status.isNetDone}>
              <div className={styleMr(styles.switchNetSign)}>
                <SwapOutlined />
              </div>

              <div className={styleMr(styles.switchNetwork)} onClick={() => this.onSwitchToSource()}>
                Switch Network
              </div>
            </Visible>
          </div>
        </div>

        <div className={styleMr(styles.action)}>
          <SldButton
            size={this.state.isMobile ? 'large' : 'huge'}
            type={'none'}
            className={styleMr(styles.btn, cssPick(status.isPending, styles.disabled))}
            onClick={() => {
              if (this.props.onReset) {
                this.props.onReset();
              }
            }}
            disabled={this.isDisabledGoBack(status)}
          >
            <I18n id={'stone-go-back'} textUpper={'uppercase'} />
          </SldButton>
        </div>
      </div>
    );
  }
}
