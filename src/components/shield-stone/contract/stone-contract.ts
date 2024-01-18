import { Observable, of, switchMap, zip } from 'rxjs';
import { Network } from '../../../constant/network';
import { map, take } from 'rxjs/operators';
import { Contract, providers, Signer } from 'ethers';
import {
  STANDARD_BRIDGE,
  STONE_ADDRESS,
  STONE_CONFIG_KEYS,
  StoneConfigFields,
  StoneContractConfig,
} from '../const/stone-address';
import { STONE_ABI } from '../const/stone-abi';
import { createChainContract } from '../../../state-manager/const/contract-creator';
import { BaseContractManager } from '../../../state-manager/const/base-contract-manager';
import { walletState } from '../../../state-manager/wallet/wallet-state';

export class StoneContract extends BaseContractManager<StoneConfigFields> {
  public readonly STANDARD_BRIDGE_STONE_ADDRESS: Observable<string | undefined> = this.watchStandardBridgeAddress();
  public readonly STANDARD_BRIDGE_STONE_CONTRACT: Observable<Contract | null> = this.watchStandardBridgeContract();

  public createStrategyContract(strategyAddress: string): Observable<Contract> {
    type Provider = providers.Provider | Signer;
    const network$: Observable<Network> = this.watchNetwork();
    const provider$: Observable<Provider> = this.watchProvider();

    return zip(network$, provider$).pipe(
      map(([network, provider]: [Network, Provider]) => {
        const abi: any[] = STONE_ABI['strategy'];
        return createChainContract(strategyAddress, abi, provider, network);
      }),
      take(1)
    );
  }

  // -------------------------------------------------------------------------------------------------------------------
  // private

  private watchStandardBridgeAddress(): Observable<string | undefined> {
    return walletState.watchNetwork().pipe(
      map((network: Network) => {
        return STANDARD_BRIDGE[network];
      })
    );
  }

  private watchStandardBridgeContract(): Observable<Contract | null> {
    return this.watchStandardBridgeAddress().pipe(
      switchMap((address: string | undefined): Observable<Contract | null> => {
        if (address) {
          const network$: Observable<Network> = walletState.watchNetwork().pipe(take(1));
          const provider$: Observable<providers.Provider> = walletState.watchWeb3Provider().pipe(take(1));

          return zip(network$, provider$).pipe(
            map(([network, provider]: [Network, providers.Provider]) => {
              return createChainContract(address, STONE_ABI.stoneToken, provider, network);
            })
          );
        } else {
          return of(null);
        }
      })
    );
  }

  getConfigContractNames(): readonly StoneConfigFields[] {
    return STONE_CONFIG_KEYS;
  }

  getContractAbi(contractName: StoneConfigFields): any[] {
    return STONE_ABI[contractName];
  }

  getContractAddress(network: Network, contractName: StoneConfigFields): string | undefined {
    const config: StoneContractConfig | undefined = STONE_ADDRESS[network];
    return config ? config[contractName] : undefined;
  }

  getCurChainContractAddress(contractName: StoneConfigFields): string | undefined {
    const network: Network | null = walletState.getCurNetwork();
    const config: StoneContractConfig | undefined = network ? STONE_ADDRESS[network] : undefined;

    return config ? config[contractName] : undefined;
  }
}

export const stoneContracts: StoneContract = new StoneContract();
