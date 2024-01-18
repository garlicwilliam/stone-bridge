import { walletState } from '../../../state-manager/wallet/wallet-state';
import { catchError, map, mergeMap, switchMap, take, toArray } from 'rxjs/operators';
import { Contract, ethers, Signer } from 'ethers';
import { isInNetworkGroup } from '../../../constant/network-util';
import {
  NET_ETHEREUM,
  NET_GOERLI,
  NET_MANTA_PACIFIC,
  NET_MANTA_PACIFIC_TEST,
  Network,
  NETWORKS_ETH,
  NETWORKS_MANTA,
} from '../../../constant/network';
import {
  CrossChainMessenger,
  MessageDirection,
  MessageStatus,
  TokenBridgeMessage,
  OEL1Contracts,
} from '@eth-optimism/sdk';
import { from, Observable, of, zip } from 'rxjs';
import { envSelect, ExeEnv } from '../const/const-var';
import { SldDecimal } from '../../../util/decimal';
import { stoneContracts } from '../contract/stone-contract';
import { loadingObs } from '../../../services/utils';
import { i18n } from '../../i18n/i18n-fn';
import { isSameAddress } from '../../../util/address';
import { STANDARD_BRIDGE } from '../const/stone-address';
import { getStoneRpc } from '../const/stone-jsrpc';
import { providerChainId } from '../../../state-manager/contract/contract-provider-utils';

type OptsContractsL1 = { [key in keyof OEL1Contracts]: string };
type ProviderInfo = { provider: Provider | ethers.Signer; chainId: number };
type BridgeTokenAddresses = { l1Token: string; l2Token: string };
type Provider = ethers.providers.JsonRpcProvider;

export class MantaBridgeService {
  private readonly contractL1Test: OptsContractsL1 = {
    StateCommitmentChain: '0x0000000000000000000000000000000000000000',
    BondManager: '0x0000000000000000000000000000000000000000',
    CanonicalTransactionChain: '0x0000000000000000000000000000000000000000',
    AddressManager: '0x0AaeDFF2961D05021832cA093cf9409eDF5ECa8C',
    L1CrossDomainMessenger: '0x7Ad11bB9216BC9Dc4CBd488D7618CbFD433d1E75',
    L1StandardBridge: '0x4638aC6b5727a8b9586D3eba5B44Be4b74ED41Fc',
    OptimismPortal: '0x7FD7eEA37c53ABf356cc80e71144D62CD8aF27d3',
    L2OutputOracle: '0x8553D4d201ef97F2b76A28F5E543701b25e55B1b',
  };
  private readonly contractL1Prod: OptsContractsL1 = {
    StateCommitmentChain: '0x0000000000000000000000000000000000000000',
    BondManager: '0x0000000000000000000000000000000000000000',
    CanonicalTransactionChain: '0x0000000000000000000000000000000000000000',
    AddressManager: '0x3Ad319BB4872F8cB75a26Ac30CC4bD2d56b67b05',
    L1CrossDomainMessenger: '0x635ba609680c55C3bDd0B3627b4c5dB21b13c310',
    L1StandardBridge: '0x3B95bC951EE0f553ba487327278cAc44f29715E5',
    OptimismPortal: '0x9168765EE952de7C6f8fC6FaD5Ec209B960b7622',
    L2OutputOracle: '0x30c789674ad3B458886BBC9abf42EEe19EA05C1D',
  };

  private getL1Contracts(): OptsContractsL1 {
    return envSelect({
      [ExeEnv.Test]: this.contractL1Test,
      [ExeEnv.Alpha]: this.contractL1Prod,
      [ExeEnv.Prod]: this.contractL1Prod,
    });
  }

  private getL2Provider(): Observable<ProviderInfo> {
    const currentNet: Network = walletState.getCurNetwork()!;
    const curProvider$: Observable<ethers.Signer> = walletState.watchSigner().pipe(take(1));

    if (isInNetworkGroup(currentNet, NETWORKS_MANTA)) {
      // current is on l2
      return curProvider$.pipe(
        switchMap((signer: ethers.Signer) => {
          const chainId$: Observable<number> = from(signer.getChainId());

          return zip(of(signer), chainId$).pipe(
            map(([provider, chainId]): ProviderInfo => {
              return { provider, chainId };
            })
          );
        })
      );
    } else {
      // current is on l1

      const provider: Provider = getStoneRpc(this.getL2Network()) as Provider;
      const chainId: number = providerChainId(provider) as number;
      return of({ provider, chainId });
    }
  }

  private getL1Provider(): Observable<ProviderInfo> {
    const currentNet: Network = walletState.getCurNetwork()!;
    const curProvider$: Observable<ethers.Signer> = walletState.watchSigner().pipe(take(1));

    if (isInNetworkGroup(currentNet, NETWORKS_ETH)) {
      // current is on l1
      return curProvider$.pipe(
        switchMap((provider: Signer) => {
          return from(provider.getChainId()).pipe(
            map((chainId: number): ProviderInfo => {
              return {
                provider,
                chainId,
              };
            })
          );
        })
      );
    } else {
      const provider = getStoneRpc(this.getL1Network()) as Provider;
      const chainId = providerChainId(provider) as number;

      return of({ provider, chainId });
    }
  }

  private getTokenAddresses(): BridgeTokenAddresses {
    const l1Token: string | undefined = STANDARD_BRIDGE[this.getL1Network()];
    const l2Token: string | undefined = STANDARD_BRIDGE[this.getL2Network()];

    return { l1Token: l1Token!, l2Token: l2Token! };
  }

  private curNetwork(): Network {
    return walletState.getCurNetwork()!;
  }

  private isTestNetwork(): boolean {
    const network: Network = this.curNetwork();

    return isInNetworkGroup(network, [NET_GOERLI, NET_MANTA_PACIFIC_TEST]);
  }

  private isOnL1(): boolean {
    const network: Network = this.curNetwork();

    return isInNetworkGroup(network, NETWORKS_ETH);
  }

  private isOnL2(): boolean {
    const network: Network = this.curNetwork();

    return isInNetworkGroup(network, NETWORKS_MANTA);
  }

  // ---------------------------------------------------------------------

  public approve(amount: SldDecimal): Observable<boolean> {
    const approve$: Observable<boolean> = stoneContracts.CONTRACTS.stoneToken.pipe(
      switchMap((stoneToken: Contract) => {
        const bridgeAddress: string = this.getEthBridgeAddress();
        return from(stoneToken.approve(bridgeAddress, amount.toOrigin()));
      }),
      switchMap((rs: any) => {
        return from(rs.wait());
      }),
      map(() => {
        return true;
      }),
      catchError(() => {
        return of(false);
      })
    );

    return loadingObs(approve$, i18n('stone-approve-failed'), i18n('stone-approving'));
  }

  public getEthBridgeAddress(): string {
    return this.getL1Contracts().L1StandardBridge;
  }

  public getL2Network(): Network {
    const current: Network = walletState.getCurNetwork()!;

    const l1Tol2: boolean = isInNetworkGroup(current, NETWORKS_ETH);
    const l2tol1: boolean = isInNetworkGroup(current, NETWORKS_MANTA);

    if (l1Tol2) {
      return current === NET_ETHEREUM ? NET_MANTA_PACIFIC : NET_MANTA_PACIFIC_TEST;
    } else if (l2tol1) {
      return current;
    }

    throw 'L2 network error.';
  }

  public getL1Network(): Network {
    const current: Network = walletState.getCurNetwork()!;
    const l1Tol2: boolean = isInNetworkGroup(current, NETWORKS_ETH);
    const l2tol1: boolean = isInNetworkGroup(current, NETWORKS_MANTA);

    if (l1Tol2) {
      return current;
    } else if (l2tol1) {
      return current === NET_MANTA_PACIFIC ? NET_ETHEREUM : NET_GOERLI;
    }

    throw 'L1 network error.';
  }

  public getTargetNetwork(): Network {
    if (this.isOnL1()) {
      return this.isTestNetwork() ? NET_MANTA_PACIFIC_TEST : NET_MANTA_PACIFIC;
    } else if (this.isOnL2()) {
      return this.isTestNetwork() ? NET_GOERLI : NET_ETHEREUM;
    } else {
      return NET_MANTA_PACIFIC;
    }
  }

  public getCrossMessenger(): Observable<CrossChainMessenger> {
    const l1Provider$: Observable<ProviderInfo> = this.getL1Provider();
    const l2Provider$: Observable<ProviderInfo> = this.getL2Provider();

    return zip(l1Provider$, l2Provider$).pipe(
      map(([l1Provider, l2Provider]: [ProviderInfo, ProviderInfo]) => {
        return new CrossChainMessenger({
          contracts: {
            l1: this.getL1Contracts(),
          },
          l1ChainId: l1Provider.chainId,
          l1SignerOrProvider: l1Provider.provider,
          l2ChainId: l2Provider.chainId,
          l2SignerOrProvider: l2Provider.provider,
          bedrock: true,
        });
      })
    );
  }

  public getWithdraws(): Observable<TokenBridgeMessage[]> {
    const userAddress$: Observable<string> = walletState.USER_ADDR.pipe(take(1));
    const messenger$: Observable<CrossChainMessenger> = this.getCrossMessenger();
    const { l1Token }: BridgeTokenAddresses = this.getTokenAddresses();

    return zip(messenger$, userAddress$).pipe(
      switchMap(([messenger, userAddress]: [CrossChainMessenger, string]) => {
        return zip(from(messenger.getWithdrawalsByAddress(userAddress)), of(messenger));
      }),
      switchMap(([messages, messenger]: [TokenBridgeMessage[], CrossChainMessenger]) => {
        messages = messages
          .filter((mes: TokenBridgeMessage) => isSameAddress(mes.l1Token, l1Token))
          .filter((mes: TokenBridgeMessage): boolean => mes.direction === MessageDirection.L2_TO_L1);

        return from(messages).pipe(
          mergeMap((message: TokenBridgeMessage) => {
            return this.loadBridgeMessage(messenger, message);
          }),
          toArray()
        );
      }),
      map((messages: TokenBridgeMessage[]) => {
        return messages.filter((message: TokenBridgeMessage): boolean => message['status'] !== MessageStatus.RELAYED);
      })
    );
  }

  public loadBridgeMessage(
    messenger: CrossChainMessenger,
    message: TokenBridgeMessage
  ): Observable<TokenBridgeMessage> {
    return from(messenger.getMessageStatus(message)).pipe(
      map((status: MessageStatus) => {
        message['status'] = status;
        return message;
      })
    );
  }

  public bridgeToManta(messenger: CrossChainMessenger, amount: SldDecimal): Observable<string> {
    const { l1Token, l2Token }: BridgeTokenAddresses = this.getTokenAddresses();

    const bridge$: Observable<string> = from(messenger.depositERC20(l1Token, l2Token, amount.toOrigin())).pipe(
      switchMap((res: ethers.providers.TransactionResponse) => {
        return from(res.wait());
      }),
      map((res: ethers.providers.TransactionReceipt) => {
        return res.transactionHash;
      }),
      catchError(err => {
        console.warn('error', err);
        return of('');
      })
    );

    return bridge$;
  }

  public bridgeFromManta(messenger: CrossChainMessenger, amount: SldDecimal): Observable<string> {
    const { l1Token, l2Token }: BridgeTokenAddresses = this.getTokenAddresses();

    const bridge$: Observable<string> = from(messenger.withdrawERC20(l1Token, l2Token, amount.toOrigin())).pipe(
      switchMap((res: ethers.providers.TransactionResponse) => {
        return from(res.wait());
      }),
      map((res: ethers.providers.TransactionReceipt) => {
        return res.transactionHash;
      }),
      catchError(err => {
        return of('');
      })
    );

    return bridge$;
  }

  public onProve(message: TokenBridgeMessage): Observable<boolean> {
    const prove$: Observable<boolean> = this.getCrossMessenger().pipe(
      switchMap((messenger: CrossChainMessenger) => {
        return from(messenger.proveMessage(message));
      }),
      switchMap((res: any) => {
        return from(res.wait());
      }),
      map(() => true),
      catchError(err => {
        return of(false);
      })
    );

    return loadingObs(prove$);
  }

  public onFinalize(message: TokenBridgeMessage): Observable<boolean> {
    const finalize$: Observable<boolean> = this.getCrossMessenger().pipe(
      switchMap((messenger: CrossChainMessenger) => {
        return from(messenger.finalizeMessage(message));
      }),
      switchMap((res: ethers.providers.TransactionResponse) => {
        return from(res.wait());
      }),
      map(() => true),
      catchError(err => {
        return of(false);
      })
    );

    return loadingObs(finalize$);
  }
}

export const mantaBridgeService: MantaBridgeService = new MantaBridgeService();
