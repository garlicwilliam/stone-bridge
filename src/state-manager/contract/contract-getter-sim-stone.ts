import { Contract, ethers, BigNumber, providers } from 'ethers';
import { concatMap, EMPTY, from, mergeMap, Observable, of, switchMap, zip } from 'rxjs';
import { genContractCallPartial } from './contract-utils';
import { SldDecimal, SldDecPercent, SldDecPrice } from '../../util/decimal';
import { catchError, filter, map, take, toArray } from 'rxjs/operators';
import {
  CACHE_10_SEC,
  CACHE_1_HOUR,
  CACHE_1_MIN,
  CACHE_2_MIN,
  CACHE_30_SEC,
  CACHE_3_SEC,
  CACHE_FOREVER,
  cacheService,
} from '../mem-cache/cache-contract';
import {
  StoneApyPrimaryData,
  StoneBridgeCrossCapacity,
  StonePoolUserStartTime,
  StoneProposalAddStrategy,
  StoneProposalDetail,
  StoneProposalType,
  StoneProposalUpdatePortfolio,
  StoneStrategy,
  StoneStrategyInfo,
  UniSwapV3PosNft,
  StoneUserInfo,
  TokenErc20,
  UniSwapSlot0,
  StonePoolHasStaked,
} from '../state-types';
import { ETH_DECIMAL, MAX_UINT_256, STONE_DECIMAL, ZERO } from '../../constant';
import { baseBigNumber } from '../../util/ethers';
import { stoneContracts } from '../../components/shield-stone/contract/stone-contract';
import {
  contractNetwork,
  createChainContract,
  createContractByEnv,
  createContractByProvider,
  createErc20Contract,
} from '../const/contract-creator';
import * as _ from 'lodash';
import { arrayInteger } from '../../util/array';
import { erc20DecimalGetter, erc20TotalSupplyGetter } from './contract-getter-sim-erc20';
import { curTimestamp } from '../../util/time';
import { computeStoneApy } from '../../components/shield-stone/utils/apy';
import { Network } from '../../constant/network';
import { CrossChainIdMap } from '../../components/shield-stone/const/bridge';
import { walletState } from '../wallet/wallet-state';
import { NetworkParams } from '../../constant/network-conf';
import { ABI_ERC20_MINING, STONE_ABI } from '../../components/shield-stone/const/stone-abi';
import { PERCENT_DECIMAL } from '../../components/shield-stone/const/const-var';
import { shortAddress } from '../../util';
import { uniSwapV3PositionNftGetter } from './contract-getter-cpx-uniswap';
import { linkAnswerGetter } from './contract-getter-sim-link';

const StonePriceDecimal = 18;
const stoneVaultCall: <T>(promise: Promise<T>, method: string) => Observable<T> = genContractCallPartial('StoneVault');
const strategyControlCall: <T>(promise: Promise<T>, method: string) => Observable<T> =
  genContractCallPartial('StoneStrategyControl');
const strategyCall: <T>(promise: Promise<T>, method: string) => Observable<T> = genContractCallPartial('StoneStrategy');
const proposalCall: <T>(promise: Promise<T>, method: string) => Observable<T> = genContractCallPartial('StoneProposal');
const miningCall: <T>(promise: Promise<T>, method: string) => Observable<T> = genContractCallPartial('StoneMining');
const nftCall: <T>(promise: Promise<T>, method: string) => Observable<T> = genContractCallPartial('StoneNft');
const stoneCall: <T>(promise: Promise<T>, method: string) => Observable<T> = genContractCallPartial('StoneToken');

const genCacheKey = (contract: Contract, key: string, param?: string) => {
  const cNetwork: Network | null = contractNetwork(contract);
  return `STONE_net:${cNetwork}_cnt:${contract.address}_key:${key}_param:${param || ''}`;
};

// last round id
export function stoneVaultLastRoundGetter(stoneVaultContract: Contract): Observable<BigNumber> {
  const cacheKey: string = genCacheKey(stoneVaultContract, 'last_round');
  const round$ = stoneVaultCall(stoneVaultContract.latestRoundID() as Promise<BigNumber>, 'latestRoundID()').pipe(
    catchError(err => {
      console.warn('error', err);
      return EMPTY;
    })
  );

  return cacheService.tryUseCache(round$, cacheKey, CACHE_1_HOUR);
}

// eth amount per share; SharePrice
export function stoneVaultSharePriceGetter(stoneVaultContract: Contract): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(stoneVaultContract, 'share-price');

  const curPrice$ = stoneVaultCall(
    stoneVaultContract.currentSharePrice() as Promise<BigNumber>,
    'currentSharePrice()'
  ).pipe(
    map((price: BigNumber) => {
      return SldDecimal.fromOrigin(price, StonePriceDecimal);
    }),
    catchError(err => {
      console.warn('current share price error:', err);
      return of(SldDecimal.fromNumeric('1', StonePriceDecimal));
    })
  );

  return cacheService.tryUseCache(curPrice$, cacheKey, CACHE_2_MIN);
}

// eth amount per share in past rounds
export function stoneVaultHistoryPriceGetter(stoneVaultContract: Contract, round: BigNumber): Observable<SldDecimal> {
  const roundStr = round.toString();
  const cacheKey: string = genCacheKey(stoneVaultContract, 'history_price', roundStr);

  const promise: Promise<BigNumber> = stoneVaultContract.roundPricePerShare(round) as Promise<BigNumber>;
  const price$: Observable<SldDecimal> = stoneVaultCall(promise, `roundPricePerShare(${roundStr})`).pipe(
    map((price: BigNumber) => {
      return SldDecimal.fromOrigin(price, StonePriceDecimal);
    })
  );

  return cacheService.tryUseCache(price$, cacheKey, CACHE_FOREVER);
}

export function stoneInstantWithdrawReceiveGetter(
  stoneVaultContract: Contract,
  stoneAmount: SldDecimal | null
): Observable<SldDecimal> {
  if (!stoneAmount || stoneAmount.isZero()) {
    return of(SldDecimal.ZERO);
  }

  let iw = STONE_ABI.stoneVault.find(one => one.type === 'function' && one.name === 'instantWithdraw');
  iw = Object.assign({}, iw);
  iw['stateMutability'] = 'view';

  return walletState.watchSigner().pipe(
    map((provider: ethers.Signer) => {
      const vault: Contract = createChainContract(
        stoneVaultContract.address,
        [iw],
        provider,
        contractNetwork(stoneVaultContract)!
      );

      return vault;
    }),
    switchMap(vault => {
      const promise$: Promise<BigNumber> = vault.instantWithdraw(ZERO, stoneAmount.toOrigin()) as Promise<BigNumber>;
      const receive$: Observable<SldDecimal> = stoneVaultCall(
        promise$,
        `instantWithdraw(0, ${stoneAmount.format({ fix: 10 })})`
      ).pipe(
        map((amount: BigNumber) => {
          return SldDecimal.fromOrigin(amount, ETH_DECIMAL);
        })
      );

      return receive$;
    })
  );
}

export function stoneVaultHistorySettleTimeGetter(stoneVaultContract: Contract, round: BigNumber): Observable<number> {
  const roundStr: string = round.toString();
  const cacheKey: string = genCacheKey(stoneVaultContract, 'history_settle_time', roundStr);

  const promise: Promise<BigNumber> = stoneVaultContract.settlementTime(round) as Promise<BigNumber>;
  const time$: Observable<number> = stoneVaultCall(promise, `settlementTime(${roundStr})`).pipe(
    map((time: BigNumber) => {
      return time.toNumber();
    })
  );

  return cacheService.tryUseCache(time$, cacheKey, CACHE_FOREVER, {
    vault: stoneVaultContract.address,
    round: round.toString(),
  });
}

export function stoneVaultLastRoundPriceGetter(stoneVaultContract: Contract): Observable<SldDecimal> {
  return stoneVaultLastRoundGetter(stoneVaultContract).pipe(
    switchMap((roundId: BigNumber) => {
      const round: BigNumber = roundId.gt(0) ? roundId.sub(1) : ZERO;
      return stoneVaultHistoryPriceGetter(stoneVaultContract, round);
    })
  );
}

export function stoneVaultApyGetter(stoneVaultContract: Contract, period: number): Observable<SldDecPercent> {
  type RoundTime = { round: BigNumber; time: number };

  function getStartRoundTime(stoneVaultContract: Contract, last: number, period: number): Observable<RoundTime> {
    const ids: number[] = arrayInteger(last, 0, 1);

    return from(ids).pipe(
      concatMap(id => {
        return stoneVaultHistorySettleTimeGetter(stoneVaultContract, BigNumber.from(id)).pipe(
          map(time => {
            return { time, id };
          })
        );
      }),
      filter(({ time, id }) => {
        return curTimestamp() - time <= period;
      }),
      take(1),
      map(({ id, time }): RoundTime => {
        return { round: BigNumber.from(id), time };
      })
    );
  }

  function getEndRoundTime(stoneVaultContract: Contract, last: number): Observable<RoundTime> {
    const id: number = last - 1;

    return stoneVaultHistorySettleTimeGetter(stoneVaultContract, BigNumber.from(id)).pipe(
      map((time: number): RoundTime => {
        return { time, round: BigNumber.from(id) };
      })
    );
  }

  function getApy(startRound: RoundTime, lastRound: RoundTime): Observable<SldDecPercent> {
    if (startRound.round.eq(lastRound.round)) {
      return of(SldDecPercent.ZERO);
    }

    const startPrice$: Observable<SldDecimal> = stoneVaultHistoryPriceGetter(stoneVaultContract, startRound.round);
    const endPrice$: Observable<SldDecimal> = stoneVaultHistoryPriceGetter(stoneVaultContract, lastRound.round);

    return zip(startPrice$, endPrice$).pipe(
      map(([startPrice, endPrice]: [SldDecimal, SldDecimal]) => {
        return computeStoneApy(startRound.time, lastRound.time, startPrice, endPrice);
      })
    );
  }

  const cacheKey: string = genCacheKey(stoneVaultContract, 'stone_apy_', period.toString());

  const apy$: Observable<SldDecPercent> = stoneVaultLastRoundGetter(stoneVaultContract).pipe(
    switchMap((lastRound: BigNumber): Observable<SldDecPercent> => {
      if (lastRound.lt(1)) {
        return of(SldDecPercent.ZERO);
      }

      const start$: Observable<RoundTime> = getStartRoundTime(stoneVaultContract, lastRound.toNumber(), period);
      const last$: Observable<RoundTime> = getEndRoundTime(stoneVaultContract, lastRound.toNumber());

      return zip(start$, last$).pipe(
        switchMap(([start, end]: [RoundTime, RoundTime]) => {
          return getApy(start, end);
        })
      );
    })
  );

  return cacheService.tryUseCache(apy$, cacheKey, CACHE_1_HOUR);
}

export function stoneTotalSupply(stoneTokenAddr: string, provider: ethers.providers.Provider): Observable<SldDecimal> {
  return createContractByProvider(stoneTokenAddr, STONE_ABI.stoneToken, provider).pipe(
    switchMap((contract: Contract) => {
      return erc20TotalSupplyGetter(contract, STONE_DECIMAL);
    })
  );
}

export function stoneVaultExitFeeRate(stoneVaultContract: Contract): Observable<SldDecPercent> {
  const cacheKey: string = genCacheKey(stoneVaultContract, 'exit_fee_rate');
  const promise: Promise<BigNumber> = stoneVaultContract.withdrawFeeRate() as Promise<BigNumber>;
  const feeRate$: Observable<SldDecPercent> = stoneVaultCall(promise, 'withdrawFeeRate()').pipe(
    map((num: BigNumber) => {
      return SldDecPercent.fromOrigin(num, PERCENT_DECIMAL);
    })
  );

  return cacheService.tryUseCache(feeRate$, cacheKey, CACHE_FOREVER);
}

// bind stone token contract
export function stoneTokenContract(stoneVaultContract: Contract): Observable<string> {
  const cacheKey: string = genCacheKey(stoneVaultContract, 'stone_token');
  const promise: Promise<string> = stoneVaultContract.stone() as Promise<string>;

  return cacheService.tryUseCache(stoneVaultCall(promise, 'stone()'), cacheKey, CACHE_FOREVER);
}

// bind stone assets contract
export function stoneAssetsContract(strategyControlContract: Contract): Observable<string> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'stone_assets');
  const promise: Promise<string> = strategyControlContract.assetsVault() as Promise<string>;
  const assets$: Observable<string> = stoneVaultCall(promise, 'assetsVault()');

  return cacheService.tryUseCache(assets$, cacheKey, CACHE_FOREVER);
}

export function stoneAssetsEthBalanceGetter(strategyControlContract: Contract): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'vault_assets_eth_balance');
  const balance$: Observable<SldDecimal> = of(strategyControlContract.provider).pipe(
    switchMap((provider: ethers.providers.Provider) => {
      return stoneAssetsContract(strategyControlContract).pipe(
        switchMap((assetsAddress: string) => {
          return from(provider.getBalance(assetsAddress));
        })
      );
    }),
    map((amount: BigNumber) => {
      return SldDecimal.fromOrigin(amount, ETH_DECIMAL);
    })
  );

  return cacheService.tryUseCache(balance$, cacheKey, CACHE_1_MIN);
}

// user info
export function stoneUserInfoGetter(stoneVaultContract: Contract, userAddress: string): Observable<StoneUserInfo> {
  type Rs = {
    withdrawRound: BigNumber;
    withdrawShares: BigNumber;
    withdrawableAmount: BigNumber;
  };
  const cacheKey: string = genCacheKey(stoneVaultContract, 'user_info');
  const promise: Promise<Rs> = stoneVaultContract.userReceipts(userAddress) as Promise<Rs>;
  const lastRound$: Observable<BigNumber> = stoneVaultLastRoundGetter(stoneVaultContract);
  const info$: Observable<Rs> = stoneVaultCall(promise, `userReceipts(${userAddress})`);

  const rs$: Observable<StoneUserInfo> = zip(lastRound$, info$).pipe(
    switchMap(([lastRound, info]: [BigNumber, Rs]) => {
      const usePastRound: boolean = info.withdrawRound.gt(0) && info.withdrawRound.lt(lastRound);

      const info$: Observable<StoneUserInfo> = usePastRound
        ? stoneVaultHistoryPriceGetter(stoneVaultContract, info.withdrawRound).pipe(
            map((price: SldDecimal) => {
              return price.mul(info.withdrawShares).div(baseBigNumber(STONE_DECIMAL));
            }),
            map((oldAmount: SldDecimal) => {
              const oldestAmount: SldDecimal = SldDecimal.fromOrigin(info.withdrawableAmount, ETH_DECIMAL);
              return oldAmount.add(oldestAmount);
            }),
            map((claimableAmount: SldDecimal): StoneUserInfo => {
              return {
                request: { round: ZERO, stoneAmount: SldDecimal.ZERO },
                withdrawableEth: claimableAmount,
              };
            })
          )
        : of({
            request: {
              round: info.withdrawRound,
              stoneAmount: SldDecimal.fromOrigin(info.withdrawShares, STONE_DECIMAL),
            },
            withdrawableEth: SldDecimal.fromOrigin(info.withdrawableAmount, ETH_DECIMAL),
          });

      return info$;
    })
  );

  return cacheService.tryUseCache(rs$, cacheKey, CACHE_3_SEC);
}

// idle eth assets
export function stoneIdleEth(stoneVaultContract: Contract): Observable<SldDecimal> {
  type Rs = {
    idleAmount: BigNumber;
    investedAmount: BigNumber;
  };
  const cacheKey: string = genCacheKey(stoneVaultContract, 'available_eth_amount');
  const promise: Promise<Rs> = stoneVaultContract.getVaultAvailableAmount() as Promise<Rs>;
  const available$: Observable<SldDecimal> = stoneVaultCall(promise, 'getVaultAvailableAmount()').pipe(
    map((rs: Rs) => {
      return { idle: rs.idleAmount, invested: rs.investedAmount };
    }),
    map(available => {
      return SldDecimal.fromOrigin(available.idle, ETH_DECIMAL);
    })
  );

  return cacheService.tryUseCache(available$, cacheKey);
}

export function stoneTvlGetter(strategyControlContract: Contract): Observable<SldDecimal> {
  const deployed$: Observable<SldDecimal> = strategyAllValueGetter(strategyControlContract);
  const assetsEth$: Observable<SldDecimal> = stoneAssetsEthBalanceGetter(strategyControlContract);

  return zip(deployed$, assetsEth$).pipe(
    map(([deployed, assetsEth]: [SldDecimal, SldDecimal]) => {
      return deployed.add(assetsEth);
    })
  );
}

export function stoneEthPriceGetter(oracleContract: Contract): Observable<SldDecPrice> {
  const cacheKey: string = genCacheKey(oracleContract, 'stone-eth-price');
  const price$ = linkAnswerGetter(oracleContract);

  return cacheService.tryUseCache(price$, cacheKey, CACHE_1_MIN);
}

// apy primary data
export function stoneApyDataGetter(stoneVaultContract: Contract): Observable<StoneApyPrimaryData[]> {
  const cacheKey: string = genCacheKey(stoneVaultContract, 'apy_data_array');

  const lastRoundId$: Observable<BigNumber> = stoneVaultLastRoundGetter(stoneVaultContract);
  const roundDataGetter = (roundId: number): Observable<StoneApyPrimaryData> => {
    const round: BigNumber = BigNumber.from(roundId);
    const price$: Observable<SldDecimal> = stoneVaultHistoryPriceGetter(stoneVaultContract, round);
    const time$: Observable<number> = stoneVaultHistorySettleTimeGetter(stoneVaultContract, round);

    return zip(price$, time$).pipe(
      map(([price, time]: [SldDecimal, number]) => {
        return { price, time, round: roundId };
      })
    );
  };

  const data$: Observable<StoneApyPrimaryData[]> = lastRoundId$.pipe(
    map((lastRound: BigNumber): number[] => {
      if (lastRound.eq(0)) {
        return [] as number[];
      } else {
        return arrayInteger(lastRound.toNumber(), 0);
      }
    }),
    switchMap((roundIds: number[]) => {
      return from(roundIds).pipe(
        concatMap((roundId: number) => {
          return roundDataGetter(roundId);
        }),
        toArray()
      );
    })
  );

  return cacheService.tryUseCache(data$, cacheKey, CACHE_1_HOUR);
}

// ---------------------------------------------------------------------------------------------------------------------

// strategy contract list and allocation
export function strategyListGetter(strategyControlContract: Contract): Observable<StoneStrategy[]> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'strategy_list');
  const promise = strategyControlContract.getStrategies() as Promise<{
    addrs: string[];
    portions: BigNumber[];
  }>;

  const strategy$: Observable<StoneStrategy[]> = strategyControlCall(promise, 'getStrategies()').pipe(
    map(({ addrs, portions }: { addrs: string[]; portions: BigNumber[] }) => {
      const strategy: StoneStrategy[] = addrs.map((address, index) => {
        return {
          address,
          network: contractNetwork(strategyControlContract),
          allocation: SldDecPercent.fromOrigin(portions[index], PERCENT_DECIMAL),
        } as StoneStrategy;
      });

      return strategy;
    })
  );

  return cacheService.tryUseCache(strategy$, cacheKey, CACHE_1_HOUR);
}

export function strategyInfoListGetter(strategyControlContract: Contract): Observable<StoneStrategyInfo[]> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'strategy_info_list');
  const strategies$: Observable<StoneStrategy[]> = strategyListGetter(strategyControlContract);

  const strategyNameFun = (strategyAddress: string) => {
    return stoneContracts.createStrategyContract(strategyAddress).pipe(
      switchMap((strategyContract: Contract) => {
        return strategyNameGetter(strategyContract);
      })
    );
  };
  const strategyInfo$: Observable<StoneStrategyInfo[]> = strategies$.pipe(
    switchMap((strategies: StoneStrategy[]) => {
      return from(strategies).pipe(
        concatMap((strategy: StoneStrategy) => {
          const name$: Observable<string> = strategyNameFun(strategy.address);
          const value$: Observable<SldDecimal> = strategyValidValueGetter(strategyControlContract, strategy.address);

          return zip(name$, value$, of(strategy)).pipe(
            map(([name, value, strategy]: [string, SldDecimal, StoneStrategy]) => {
              return {
                name,
                amount: value,
                contract: strategy.address,
                network: strategy.network,
                targetAllocation: strategy.allocation,
              } as StoneStrategyInfo;
            }),
            catchError(err => {
              console.warn('error', err);
              return EMPTY;
            })
          );
        }),
        toArray()
      );
    })
  );

  return cacheService.tryUseCache(strategyInfo$, cacheKey, CACHE_1_HOUR);
}

// strategy ratio
export function strategyRatioGetter(
  strategyControlContract: Contract,
  strategyAddress: string
): Observable<SldDecPercent> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'strategy_ratio');
  const promise = strategyControlContract.ratios(strategyAddress) as Promise<BigNumber>;
  const ratio$ = strategyControlCall(promise, `ratios(${strategyAddress})`).pipe(
    map(ratio => {
      return SldDecPercent.fromOrigin(ratio, PERCENT_DECIMAL);
    })
  );

  return cacheService.tryUseCache(ratio$, cacheKey, CACHE_1_HOUR);
}

// strategy value by ETH
export function strategyValueGetter(
  strategyControlContract: Contract,
  strategyAddress: string
): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'strategy_value');
  const promise: Promise<BigNumber> = strategyControlContract.getStrategyValue(strategyAddress) as Promise<BigNumber>;
  const value$: Observable<SldDecimal> = strategyControlCall(promise, `getStrategyValue(${strategyAddress})`).pipe(
    map((value: BigNumber) => {
      return SldDecimal.fromOrigin(value, ETH_DECIMAL);
    })
  );

  return cacheService.tryUseCache(value$, cacheKey, CACHE_1_HOUR);
}

// strategy valid value by ETH, not include Unstake token.
export function strategyValidValueGetter(
  strategyControlContract: Contract,
  strategyAddress: string
): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'strategy_valid_value', strategyAddress);
  const promise = strategyControlContract.getStrategyValidValue(strategyAddress) as Promise<BigNumber>;
  const value$ = strategyControlCall(promise, `getStrategyValidValue(${strategyAddress})`).pipe(
    map((value: BigNumber) => {
      return SldDecimal.fromOrigin(value, ETH_DECIMAL);
    })
  );

  return cacheService.tryUseCache(value$, cacheKey, CACHE_2_MIN);
}

// all strategy value by ETH
export function strategyAllValueGetter(strategyControlContract: Contract): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(strategyControlContract, 'strategy_all_value');

  const promise = strategyControlContract.getAllStrategiesValue() as Promise<BigNumber>;
  const value$ = strategyControlCall(promise, `getAllStrategiesValue()`).pipe(
    map((value: BigNumber) => {
      return SldDecimal.fromOrigin(value, ETH_DECIMAL);
    }),
    catchError(err => {
      console.warn('error', err);
      return of(SldDecimal.ZERO);
    })
  );

  return cacheService.tryUseCache(value$, cacheKey, CACHE_1_MIN);
}

// all strategy valid value by ETH
export function strategyAllValidValueGetter(strategyControlContract: Contract): Observable<SldDecimal> {
  const cacheKey = genCacheKey(strategyControlContract, 'strategy_all_valid_value');
  const promise = strategyControlContract.getAllStrategyValidValue() as Promise<BigNumber>;
  const value$ = strategyControlCall(promise, `getAllStrategyValidValue()`).pipe(
    map((value: BigNumber) => {
      return SldDecimal.fromOrigin(value, ETH_DECIMAL);
    })
  );

  return cacheService.tryUseCache(value$, cacheKey, CACHE_1_HOUR);
}

// ---------------------------------------------------------------------------------------------------------------------

export function strategyNameGetter0(strategyAddress: string): Observable<string> {
  return stoneContracts.createStrategyContract(strategyAddress).pipe(
    switchMap(contract => {
      return strategyNameGetter(contract);
    })
  );
}

// strategy name of a strategy contract
export function strategyNameGetter(strategyContract: Contract): Observable<string> {
  const cacheKey: string = genCacheKey(strategyContract, 'strategy_name');
  const promise = strategyContract.name() as Promise<string>;
  const name$ = strategyCall(promise, 'name()').pipe(
    map((name: string) => {
      if (name.startsWith('rBalancer(Aura) rETH-WETH')) {
        return 'Balancer(Aura) rETH-WETH'; // fix wrong name
      }

      return name;
    })
  );

  return cacheService.tryUseCache(name$, cacheKey, CACHE_FOREVER);
}

// ---------------------------------------------------------------------------------------------------------------------

// get proposal contract list
export function proposalListGetter(proposalContract: Contract): Observable<string[]> {
  const cacheKey: string = genCacheKey(proposalContract, 'proposal_list');
  const promise = proposalContract.getProposals() as Promise<string[]>;
  const list$ = proposalCall(promise, `getProposals()`);

  return cacheService.tryUseCache(list$, cacheKey, CACHE_1_HOUR);
}

// get proposal detail
export function proposalDetailGetter(
  proposalContract: Contract,
  proposalAddress: string
): Observable<StoneProposalDetail> {
  type Rs = {
    proposer: string;
    deadline: BigNumber;
    support: BigNumber;
    oppose: BigNumber;
    executedTime: BigNumber;
    data: string;
  };

  const cacheKey: string = genCacheKey(proposalContract, 'proposal_details', proposalAddress);
  const promise = proposalContract.proposalDetails(proposalAddress) as Promise<Rs>;
  const abiCoder = new ethers.utils.AbiCoder();
  const iFace: ethers.utils.Interface = new ethers.utils.Interface([
    'function addStrategy(address)',
    'function updatePortfolioConfig(address[],uint256[])',
  ]);

  const detail$: Observable<StoneProposalDetail> = proposalCall(promise, `proposalDetails(${proposalAddress})`).pipe(
    map((rs: Rs) => {
      const funAddStrategy: string = iFace.getSighash('addStrategy');
      const funUpdatePortfolioConfig: string = iFace.getSighash('updatePortfolioConfig');
      const abiData = rs.data as string;

      let pType: StoneProposalType;
      let detail: StoneProposalAddStrategy | StoneProposalUpdatePortfolio;

      if (abiData.startsWith(funAddStrategy)) {
        pType = StoneProposalType.AddStrategy;
        const paramStr: string = abiData.split(funAddStrategy)[1];
        const [address] = abiCoder.decode(['address'], '0x' + paramStr);

        detail = { type: pType, address: address };
      } else if (abiData.startsWith(funUpdatePortfolioConfig)) {
        pType = StoneProposalType.UpdatePortfolio;

        let paramStr: string = abiData.split(funUpdatePortfolioConfig)[1];

        const remain = paramStr.length % 64;
        if (remain !== 0) {
          paramStr = _.repeat('0', 64 - remain) + paramStr;
        }

        const rs = abiCoder.decode(['address[]', 'uint256[]'], '0x' + paramStr);

        const strategies = (rs[0] as string[]).map((strategyAddress: string, index: number) => {
          const portfolio: BigNumber = rs[1][index] as BigNumber;
          return {
            address: strategyAddress,
            portfolio: SldDecPercent.fromOrigin(portfolio, PERCENT_DECIMAL),
          };
        });

        detail = { type: pType, strategies: strategies };
      } else {
        detail = { type: StoneProposalType.AddStrategy, address: '' };
      }

      const proposal = {
        address: proposalAddress,
        deadline: rs.deadline.toNumber(),
        support: SldDecimal.fromOrigin(rs.support, STONE_DECIMAL),
        oppose: SldDecimal.fromOrigin(rs.oppose, STONE_DECIMAL),
        executed: rs.executedTime.gt(0),
        executeTime: rs.executedTime.toNumber(),
        data: rs.data,
        details: detail,
      };

      return proposal;
    }),
    catchError(error => {
      console.warn('error', error);
      return EMPTY;
    })
  );

  return cacheService.tryUseCache(detail$, cacheKey, CACHE_30_SEC);
}

// get proposal info list
export function proposalInfoListGetter(proposalContract: Contract): Observable<StoneProposalDetail[]> {
  return proposalListGetter(proposalContract).pipe(
    switchMap((proposals: string[]) => {
      return from(proposals).pipe(
        concatMap((address: string) => {
          return proposalDetailGetter(proposalContract, address);
        }),
        toArray()
      );
    }),
    map((proposals: StoneProposalDetail[]) => {
      return proposals.reverse();
    })
  );
}

// get user vote amount
export function proposalUserVoteAmountGetter(
  proposalContract: Contract,
  userAddress: string,
  proposalAddress: string
): Observable<SldDecimal> {
  const cacheKey = genCacheKey(proposalContract, 'user_vote_amount', userAddress + '_' + proposalAddress);
  const promise = proposalContract.polls(userAddress, proposalAddress) as Promise<BigNumber>;
  const amount$ = proposalCall(promise, `polls(${userAddress}-${proposalAddress})`).pipe(
    map((amount: BigNumber) => {
      return SldDecimal.fromOrigin(amount, STONE_DECIMAL);
    })
  );

  return cacheService.tryUseCache(amount$, cacheKey, CACHE_3_SEC);
}

// ---------------------------------------------------------------------------------------------------------------------

//
export function miningSupportsTokens(miningContract: Contract): Observable<string[]> {
  const cacheKey: string = genCacheKey(miningContract, 'support_tokens');
  const promise = miningContract.getAllPoolTokens() as Promise<string[]>;
  const tokens$ = miningCall(promise, `getAllPoolTokens()`);

  return cacheService.tryUseCache(tokens$, cacheKey, CACHE_FOREVER);
}

export function miningCycleGetter(miningContract: Contract): Observable<number> {
  const cacheKey: string = genCacheKey(miningContract, 'cycle');
  const promise = miningContract.cycle() as Promise<BigNumber>;
  const cycle$ = miningCall(promise, `cycle()`).pipe(map(time => time.toNumber()));

  return cacheService.tryUseCache(cycle$, cacheKey, CACHE_FOREVER);
}

export function miningUserPositionExistGetter(
  miningContract: Contract,
  userAddress: string
): Observable<StonePoolHasStaked> {
  const cacheKey: string = genCacheKey(miningContract, 'check-position', userAddress);
  const promise = miningContract.checkPosition(userAddress) as Promise<boolean>;
  const exist$ = miningCall(promise, `checkPosition(${userAddress})`).pipe(
    map((exist: boolean) => {
      return { user: userAddress, hasPosition: exist, poolAddr: miningContract.address };
    })
  );

  return cacheService.tryUseCache(exist$, cacheKey, CACHE_3_SEC);
}

export function miningUserPositionExistGetter2(
  contractAddress: string,
  provider: providers.Provider,
  userAddress: string
): Observable<StonePoolHasStaked> {
  return createContractByProvider(contractAddress, ABI_ERC20_MINING, provider).pipe(
    switchMap(contract => {
      return miningUserPositionExistGetter(contract, userAddress);
    })
  );
}

export function erc20MiningStakedAmountGetter(
  erc20MiningContract: Contract,
  userAddress: string,
  erc20: TokenErc20
): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(
    erc20MiningContract,
    'erc20_mining_stake_amount',
    userAddress + '-' + erc20.address
  );

  const promise = erc20MiningContract.stakedAmount(userAddress, erc20.address) as Promise<BigNumber>;
  const calledMethod = `stakedAmount(${shortAddress(userAddress)}, ${shortAddress(erc20.address)})`;
  const amount$ = miningCall(promise, calledMethod).pipe(map(amount => SldDecimal.fromOrigin(amount, erc20.decimal)));

  return cacheService.tryUseCache(amount$, cacheKey, CACHE_3_SEC);
}

export function miningUserLpAmountGetter(
  miningContract: Contract,
  userAddress: string,
  lpTokenAddress: string
): Observable<SldDecimal> {
  const cacheKey: string = genCacheKey(miningContract, 'user_lp_amount_', userAddress + '-' + lpTokenAddress);
  const promise = miningContract.stakedAmount(userAddress, lpTokenAddress) as Promise<BigNumber>;
  const amount$ = miningCall(promise, `stakedAmount(${userAddress}, ${lpTokenAddress})`).pipe(
    switchMap((amount: BigNumber) => {
      return createErc20Contract(lpTokenAddress).pipe(
        switchMap((contract: Contract) => {
          return erc20DecimalGetter(contract);
        }),
        map((decimal: number) => {
          return SldDecimal.fromOrigin(amount, decimal);
        })
      );
    })
  );

  return cacheService.tryUseCache(amount$, cacheKey, CACHE_3_SEC);
}

export function miningUserStartGetter(
  miningContract: Contract,
  userAddress: string
): Observable<StonePoolUserStartTime> {
  const cacheKey: string = genCacheKey(miningContract, 'user_lp_stake_start_', userAddress);
  const promise = miningContract.stakeTime(userAddress) as Promise<BigNumber>;

  const start$ = miningCall(promise, `stakeTime(${userAddress})`).pipe(
    map((time: BigNumber) => {
      return { start: time.toNumber(), user: userAddress };
    })
  );

  return cacheService.tryUseCache(start$, cacheKey, CACHE_10_SEC);
}

export function miningUserNftCountGetter(miningContract: Contract, userAddress: string): Observable<number> {
  const cacheKey: string = genCacheKey(miningContract, 'user_earned_nft', userAddress);
  const promise = miningContract.earned(userAddress) as Promise<BigNumber>;
  const count$ = miningCall(promise, `earned(${userAddress})`).pipe(
    map((count: BigNumber) => {
      return count.toNumber();
    })
  );

  return cacheService.tryUseCache(count$, cacheKey, CACHE_3_SEC, { ddd: 'ddd' });
}

export function miningTerminatedGetter(miningContract: Contract): Observable<boolean> {
  const promise$ = miningContract.terminateTime() as Promise<BigNumber>;
  const terminated$ = miningCall(promise$, 'terminateTime()').pipe(
    map((time: BigNumber) => {
      return time.gt(ZERO);
    })
  );

  const cacheKey = genCacheKey(miningContract, 'is_terminated');

  return cacheService.tryUseCache(terminated$, cacheKey, CACHE_2_MIN);
}

export function nftLpMiningAssetsIdsGetter(miningContract: Contract, userAddress: string): Observable<BigNumber[]> {
  const ids: Observable<BigNumber[]> = from(miningContract.getIdsByOwner(userAddress) as Promise<BigNumber[]>).pipe(
    switchMap((ids: BigNumber[]) => {
      return from(miningContract.filterNFT(ids) as Promise<BigNumber[]>);
    })
  );

  return ids;
}

export function posNftArrGetter(
  posNftContract: Contract,
  miningContract: Contract,
  baseToken: string,
  userAddress: string
): Observable<UniSwapV3PosNft[]> {
  return nftLpMiningAssetsIdsGetter(miningContract, userAddress).pipe(
    switchMap((ids: BigNumber[]) => {
      return from(ids).pipe(
        mergeMap((id: BigNumber) => {
          return uniSwapV3PositionNftGetter(posNftContract, id, baseToken);
        }),
        toArray()
      );
    }),
    map((nft: UniSwapV3PosNft[]) => {
      return nft.filter(one => one.liquidity.gt(0));
    })
  );
}

export function nftLpMiningLockedGetter(miningContract: Contract, userAddress: string): Observable<BigNumber[]> {
  return from(miningContract.getStakedLP(userAddress) as Promise<BigNumber[]>);
}
export function posNftLockedGetter(
  posNftContract: Contract,
  miningContract: Contract,
  baseToken: string,
  userAddress: string
): Observable<UniSwapV3PosNft[]> {
  return nftLpMiningLockedGetter(miningContract, userAddress).pipe(
    switchMap((ids: BigNumber[]) => {
      return from(ids).pipe(
        mergeMap((id: BigNumber) => {
          return uniSwapV3PositionNftGetter(posNftContract, id, baseToken);
        }),
        toArray()
      );
    })
  );
}

// ---------------------------------------------------------------------------------------------------------------------

export function stoneCrossFeesGetter(
  stoneContract: Contract,
  distChain: Network,
  userAddress: string,
  amount: SldDecimal
): Observable<{ native: SldDecimal; zero: SldDecimal }> {
  type Rs = {
    nativeFee: BigNumber;
    zroFee: BigNumber;
  };

  const chainId: number = CrossChainIdMap[distChain];

  if (!chainId || !amount || amount.isZero()) {
    return of({ native: SldDecimal.ZERO, zero: SldDecimal.ZERO });
  }

  const decimal: number = NetworkParams[distChain].nativeCurrency?.decimals || 18;

  const fee$ = from(
    stoneContract.estimateSendFee(chainId, userAddress, amount.toOrigin(), false, '0x') as Promise<Rs>
  ).pipe(
    map((rs: Rs) => {
      return {
        native: SldDecimal.fromOrigin(rs.nativeFee, decimal),
        zero: SldDecimal.fromOrigin(rs.zroFee, 18),
      };
    }),
    catchError(err => {
      console.warn('error', err);
      return of({ native: SldDecimal.ZERO, zero: SldDecimal.ZERO });
    })
  );

  return fee$;
}

export function stoneCrossCapacity(stoneContract: Contract): Observable<StoneBridgeCrossCapacity> {
  const capP$ = stoneContract.cap() as Promise<BigNumber>;
  const remainP$ = stoneContract.getQuota() as Promise<BigNumber>;

  const cap$ = stoneCall(capP$, 'cap()');
  const remain$ = stoneCall(remainP$, 'getQuota()');

  const caps$ = zip(cap$, remain$).pipe(
    map(([cap, remain]) => {
      return {
        max: SldDecimal.fromOrigin(cap, STONE_DECIMAL),
        remain: SldDecimal.fromOrigin(remain, STONE_DECIMAL),
      };
    }),
    catchError(() => {
      return of({ max: SldDecimal.ZERO, remain: SldDecimal.ZERO });
    })
  );

  const cacheKey = genCacheKey(stoneContract, 'cross_capacity');
  return cacheService.tryUseCache(caps$, cacheKey, CACHE_3_SEC);
}

// ---------------------------------------------------------------------------------------------------------------------

export function nftIdsGetter(nftContract: Contract, userAddress: string): Observable<BigNumber[]> {
  const cacheKey: string = genCacheKey(nftContract, 'user_nft_ids', userAddress);
  const promise = nftContract.getIdsByOwner(userAddress) as Promise<BigNumber[]>;
  const ids$ = nftCall(promise, `getIdsByOwner(${userAddress})`);

  return cacheService.tryUseCache(ids$, cacheKey, CACHE_3_SEC);
}

export function nftCountGetter(nftContract: Contract, userAddress: string): Observable<BigNumber> {
  const cacheKey: string = genCacheKey(nftContract, 'user_nft_count', userAddress);

  const promise_: Promise<BigNumber> = nftContract.balanceOf(userAddress) as Promise<BigNumber>;
  const count$: Observable<BigNumber> = nftCall(promise_, `balanceOf(${userAddress})`);

  return cacheService.tryUseCache(count$, cacheKey, CACHE_3_SEC);
}

export function nftOwnerGetter(nftContract: Contract): Observable<string> {
  return from(nftContract.tokenByIndex(0) as Promise<BigNumber>).pipe(
    switchMap(id => {
      return from(nftContract.ownerOf(id) as Promise<string>);
    })
  );
}
