import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../../util/string';
import styles from './standard-withdraw.module.less';
import { PageTitle } from '../../common/page-title';
import { FixPadding } from '../../../../common/content/fix-padding';
import { RedoOutlined } from '@ant-design/icons';
import { Visible } from '../../../../builtin/hidden';
import { StoneLoading } from '../../common/loading';
import stone from '../../../../../assets/imgs/tokens/stone.svg';
import { SldDecimal } from '../../../../../util/decimal';
import { STONE_DECIMAL } from '../../../../../constant';
import { MessageStatus, TokenBridgeMessage } from '@eth-optimism/sdk';
import { SldButton } from '../../../../common/buttons/sld-button';
import { asyncScheduler, combineLatest, Observable, of, Subject } from 'rxjs';
import { Network, NETWORKS_ETH } from '../../../../../constant/network';
import { walletState } from '../../../../../state-manager/wallet/wallet-state';
import { finalize, startWith, switchMap, tap } from 'rxjs/operators';
import { isInNetworkGroup } from '../../../../../constant/network-util';
import { mantaBridgeService } from '../../../service/manta-bridge.service';
import { S } from '../../../../../state-manager/contract/contract-state-parser';

type IState = {
  isMobile: boolean;

  mantaProcessMessages: TokenBridgeMessage[];
  isProcessMessagesLoading: boolean;
};
type IProps = {};

export class StandardWithdraw extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),

    mantaProcessMessages: [],
    isProcessMessagesLoading: false,
  };

  withdrawRefresh: Subject<boolean> = new Subject<boolean>();

  componentDidMount() {
    this.registerIsMobile('isMobile');

    this.registerObservable('mantaProcessMessages', this.mergeProcessMessages());
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private onRefreshTransaction() {
    this.withdrawRefresh.next(true);
  }

  private onProve(message: TokenBridgeMessage) {
    const prove$: Observable<boolean> = mantaBridgeService.onProve(message);

    this.subOnce(prove$, (done: boolean) => {
      if (done) {
        this.withdrawRefresh.next(true);
      }
    });
  }

  private onFinalize(message: TokenBridgeMessage) {
    const finalize$: Observable<boolean> = mantaBridgeService.onFinalize(message);

    this.subOnce(finalize$, (done: boolean) => {
      if (done) {
        this.withdrawRefresh.next(true);
        S.Stone.StoneUserBalance.tick();
      }
    });
  }

  private mergeProcessMessages(): Observable<TokenBridgeMessage[]> {
    const network$: Observable<Network> = walletState.NETWORK;
    const trigger$: Observable<boolean> = this.withdrawRefresh.pipe(startWith(true));
    const user$: Observable<string> = walletState.USER_ADDR;

    type CombineRs = [Network, string, boolean];

    return combineLatest([network$, user$, trigger$]).pipe(
      switchMap(([network, user, trigger]: CombineRs): Observable<TokenBridgeMessage[]> => {
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

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <div>
        <FixPadding top={60} bottom={0} mobTop={40} mobBottom={0}>
          <PageTitle title={'Withdraw From Manta'} subTitle={'Official Bridge'} />
        </FixPadding>

        <div className={styleMr(styles.wrapperManta)}>
          <div className={styleMr(styles.refreshTransaction)} onClick={() => this.onRefreshTransaction()}>
            <span>Refresh</span> <RedoOutlined />
          </div>

          <Visible when={this.state.isProcessMessagesLoading}>
            <StoneLoading size={40} />
          </Visible>

          <Visible when={!this.state.isProcessMessagesLoading}>
            <Visible when={this.state.mantaProcessMessages.length > 0}>
              {this.state.mantaProcessMessages.map((message, index) => {
                const mStatus = message['status'];

                return (
                  <div className={styleMr(styles.message)} key={index}>
                    <div className={styleMr(styles.stoneIcon)}>
                      <img src={stone} alt={''} width={20} />
                      <div>STONE</div>
                    </div>

                    <div className={styleMr(styles.stoneAmount)}>
                      <div className={styleMr(styles.desc)}>Amount</div>
                      <div className={styleMr(styles.value)}>
                        {SldDecimal.fromOrigin(message.amount, STONE_DECIMAL).format({ fix: 4 })}
                      </div>
                    </div>

                    <div className={styleMr(styles.stoneAction)}>
                      <Visible when={mStatus === MessageStatus.STATE_ROOT_NOT_PUBLISHED}>
                        <div className={styleMr(styles.stateDesc)}>Awaiting</div>
                      </Visible>

                      <Visible when={mStatus === MessageStatus.READY_TO_PROVE}>
                        <SldButton
                          size={'tiny'}
                          type={'none'}
                          className={styleMr(styles.btn, styles.actionBtn)}
                          onClick={() => this.onProve(message)}
                        >
                          {'Prove'}
                        </SldButton>
                      </Visible>

                      <Visible when={mStatus === MessageStatus.READY_FOR_RELAY}>
                        <SldButton
                          size={'tiny'}
                          type={'none'}
                          className={styleMr(styles.btn, styles.actionBtn)}
                          onClick={() => this.onFinalize(message)}
                        >
                          {'Finalize'}
                        </SldButton>
                      </Visible>

                      <Visible when={mStatus === MessageStatus.IN_CHALLENGE_PERIOD}>
                        <div className={styleMr(styles.stateDesc)}>Challenge Period</div>
                      </Visible>
                    </div>
                  </div>
                );
              })}
            </Visible>

            <Visible when={this.state.mantaProcessMessages.length === 0}>
              <div className={styleMr(styles.noData)}>No Transaction</div>
            </Visible>
          </Visible>
        </div>
      </div>
    );
  }
}
