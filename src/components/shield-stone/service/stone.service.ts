import { SldDecimal, SldDecPercent } from '../../../util/decimal';
import { combineLatest, concatMap, EMPTY, from, mergeMap, Observable, of, switchMap, zip } from 'rxjs';
import { contractCaller } from '../../../wallet/contract-caller';
import { stoneContracts } from '../contract/stone-contract';
import { catchError, map, take, tap, toArray } from 'rxjs/operators';
import { BigNumber, Contract } from 'ethers';
import { loadingObs } from '../../../services/utils';
import { i18n } from '../../i18n/i18n-fn';
import { strategyNameGetter0 } from '../../../state-manager/contract/contract-getter-sim-stone';
import { StonePoolInfo, UniSwapV3PosNft, TokenErc20, UniSwapV3PosNftAmount } from '../../../state-manager/state-types';
import { createContractByCurEnv, createErc20Contract } from '../../../state-manager/const/contract-creator';
import { MAX_UINT_256 } from '../../../constant';
import { ABI_UNI_V3_POS } from '../const/stone-abi';
import {
  uniSwapPosNftAmountGetter,
  uniSwapPosNftPoolSlot0Getter,
  uniSwapV3PositionNftGetter,
} from '../../../state-manager/contract/contract-getter-cpx-uniswap';
import * as _ from 'lodash';
import { isSameAddress } from '../../../util/address';

function stoneVaultContract(): Observable<Contract> {
  return stoneContracts.CONTRACTS.stoneVault.pipe(take(1));
}

function stoneTokenContract(): Observable<Contract> {
  return stoneContracts.CONTRACTS.stoneToken.pipe(take(1));
}

function proposalContract(): Observable<Contract> {
  return stoneContracts.CONTRACTS.proposal.pipe(take(1));
}

export function stoneDepositEth(amount: SldDecimal): Observable<boolean> {
  const deposit$ = stoneVaultContract().pipe(
    switchMap((vaultContract: Contract) => {
      return contractCaller.deposit(vaultContract, amount.toOrigin(), true);
    })
  );

  return loadingObs(deposit$, i18n('stone-deposit-failed'), i18n('stone-depositing'));
}

export function stoneRequestStone(amount: SldDecimal): Observable<boolean> {
  const request$ = stoneVaultContract().pipe(
    switchMap((vaultContract: Contract) => {
      return contractCaller.requestWithdrawStone(vaultContract, amount.toOrigin());
    })
  );

  return loadingObs(request$, i18n('stone-withdraw-failed'));
}

export function stoneRequestStoneGas(amount: SldDecimal): Observable<SldDecimal> {
  const request$ = stoneVaultContract().pipe(
    switchMap((vaultContract: Contract) => {
      return contractCaller.requestWithdrawStoneGas(vaultContract, amount.toOrigin());
    })
  );

  return request$;
}

export function stoneInstantWithdraw(amount: SldDecimal): Observable<boolean> {
  const withdraw$ = stoneVaultContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.instantWithdrawStone(contract, amount.toOrigin());
    })
  );

  return loadingObs(withdraw$, i18n('stone-withdraw-failed'));
}

export function stoneInstantWithdrawGas(amount: SldDecimal): Observable<SldDecimal> {
  return stoneVaultContract().pipe(
    switchMap((vaultContract: Contract) => {
      return contractCaller.instantWithdrawStoneGas(vaultContract, amount.toOrigin());
    }),
    catchError(err => {
      console.log(err);
      return EMPTY;
    })
  );
}

export function stoneVoteForProposal(proposal: string, amount: SldDecimal, flag: boolean): Observable<boolean> {
  const vote$ = proposalContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.voteForProposal(contract, proposal, amount.toOrigin(), flag);
    })
  );

  return loadingObs(vote$, i18n('stone-vote-failed'));
}

export function stoneRetrieveVoteToken(proposal: string): Observable<boolean> {
  const cancel$ = proposalContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.retrieveProposalToken(contract, proposal);
    })
  );

  return loadingObs(cancel$, i18n('stone-retrieve-failed'));
}

export function stoneSettleVault(): Observable<boolean> {
  const settle$ = stoneVaultContract().pipe(
    switchMap((contract: Contract) => {
      console.log('to settle');
      return contractCaller.stoneToNextRound(contract);
    })
  );

  return loadingObs(settle$, i18n('com-failed'));
}

export function stoneEthClaim(amount: SldDecimal): Observable<boolean> {
  const claim$ = stoneVaultContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.instantWithdrawStoneEth(contract, amount.toOrigin());
    })
  );

  return loadingObs(claim$, i18n('com-failed'));
}

export function stoneCancelRequestWithdraw(amount: SldDecimal): Observable<boolean> {
  const cancel$ = stoneVaultContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.cancelRequestWithdraw(contract, amount.toOrigin());
    })
  );

  return loadingObs(cancel$, i18n('com-failed'));
}

export function stoneCreateProposalAllocation(
  param: { strategyAddress: string; allocation: SldDecPercent }[]
): Observable<boolean> {
  const create$ = proposalContract().pipe(
    switchMap((contract: Contract) => {
      const params = param.map(one => {
        return {
          strategyAddress: one.strategyAddress,
          strategyAllocation: one.allocation.toOrigin(),
        };
      });

      return contractCaller.createPortfolioProposal(contract, params);
    })
  );

  return loadingObs(create$, i18n('com-failed'));
}

export function stoneExeProposal(proposalAddress: string): Observable<boolean> {
  const exe$ = proposalContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.executeProposal(contract, proposalAddress);
    })
  );

  return loadingObs(exe$, i18n('com-failed'));
}

export function stoneSetProposalPeriod(period: number): Observable<boolean> {
  const set$ = proposalContract().pipe(
    switchMap(contract => {
      return contractCaller.setProposalPeriod(contract, period);
    })
  );

  return loadingObs(set$, i18n('com-failed'));
}

export function stoneBridgeTo(
  chainId: number,
  userAddress: string,
  amount: SldDecimal,
  fees: SldDecimal
): Observable<string> {
  const bridge$ = stoneTokenContract().pipe(
    switchMap((contract: Contract) => {
      return contractCaller.stoneBridgeTo(contract, amount.toOrigin(), userAddress, chainId, fees.toOrigin());
    })
  );

  return bridge$;
}

// ---------------------------------------------------------------------------------------------------------------------

export function getStoneStrategyNames(addresses: string[]): Observable<{ [k: string]: string }> {
  return from(addresses).pipe(
    concatMap((address: string) => {
      return strategyNameGetter0(address).pipe(map((name: string) => ({ [address]: name })));
    }),
    toArray(),
    map((names: { [k: string]: string }[]) => {
      return names.reduce((acc, cur) => {
        return Object.assign(acc, cur);
      }, {});
    })
  );
}

class StoneService {
  approve(erc20TokenC: Contract, targetAddress: string, max?: SldDecimal) {
    const maxAmount = max ? max.toOrigin() : MAX_UINT_256;
    const approve$ = from(erc20TokenC.approve(targetAddress, maxAmount)).pipe(
      switchMap((rs: any) => {
        return from(rs.wait());
      }),
      map(() => {
        return true;
      }),
      catchError(err => {
        return of(false);
      })
    );

    return loadingObs(approve$, i18n('stone-approve-failed'), i18n('stone-approving'));
  }

  approveErc20Mining(miningAddress: string, erc20: TokenErc20, amount?: SldDecimal | null): Observable<boolean> {
    const erc20$: Observable<Contract> = createErc20Contract(erc20.address);

    return zip(erc20$, of(miningAddress)).pipe(
      switchMap(([erc20, mining]) => {
        return this.approve(erc20, mining, amount || undefined);
      })
    );
  }

  depositEth(amount: SldDecimal): Observable<boolean> {
    const deposit$ = stoneVaultContract().pipe(
      switchMap((vaultContract: Contract) => {
        return from(vaultContract.deposit({ value: amount.toOrigin() }));
      }),
      switchMap((rs: any) => {
        return this.resBool(rs);
      })
    );

    return loadingObs(deposit$, i18n('stone-deposit-failed'), i18n('stone-depositing'));
  }

  erc20MiningStake(miningContract: Contract, erc20: TokenErc20, amount: SldDecimal): Observable<boolean> {
    const stake$ = of(miningContract).pipe(
      switchMap((miningContract: Contract) => {
        const gas$ = this.increaseGas(miningContract.estimateGas.stake, erc20.address, amount.toOrigin());
        return zip(gas$, of(miningContract));
      }),
      switchMap(([newGas, miningContract]) => {
        return from(miningContract.stake(erc20.address, amount.toOrigin(), newGas));
      }),
      switchMap(rs => {
        return this.resBool(rs);
      })
    );

    return loadingObs(stake$, i18n('stone-stake-failed'), i18n('stone-staking'));
  }

  erc20MiningUnStake(miningContract: Contract, erc20: TokenErc20, amount: SldDecimal): Observable<boolean> {
    const unstake$ = of(miningContract).pipe(
      switchMap((miningContract: Contract) => {
        const gas$ = this.increaseGas(miningContract.estimateGas.unstake, erc20.address, amount.toOrigin());
        return zip(gas$, of(miningContract));
      }),
      switchMap(([newGas, miningContract]) => {
        return from(miningContract.unstake(erc20.address, amount.toOrigin(), newGas));
      }),
      switchMap((rs: any) => {
        return this.resBool(rs);
      })
    );

    return loadingObs(unstake$);
  }

  approveNftMining(miningAddress: string, nftContract: Contract): Observable<boolean> {
    const approve$ = from(nftContract.setApprovalForAll(miningAddress, true) as Promise<any>).pipe(
      switchMap(res => {
        return this.resBool(res);
      })
    );

    return loadingObs(approve$, i18n('stone-approve-failed'), i18n('stone-approving'));
  }

  nftMiningStake(miningContract: Contract, tokenIds: BigNumber[]): Observable<boolean> {
    const stake$ = from(miningContract.stake(tokenIds) as Promise<any>).pipe(
      switchMap(rs => {
        return this.resBool(rs);
      })
    );

    return loadingObs(stake$, i18n('stone-stake-failed'), i18n('stone-staking'));
  }

  nftMiningUnStake(miningContract: Contract, tokenIds: BigNumber[]): Observable<boolean> {
    const unstake$ = from(miningContract.unstake(tokenIds)).pipe(
      switchMap(res => {
        return this.resBool(res);
      })
    );

    return loadingObs(unstake$);
  }

  mintGNft(miningContract: Contract): Observable<boolean> {
    const mint$ = from(miningContract.claim()).pipe(
      switchMap(res => {
        return this.resBool(res);
      }),
      catchError(err => {
        return of(false);
      })
    );

    return loadingObs(mint$);
  }

  getV3NftPosContract(pool: StonePoolInfo): Observable<Contract> {
    return createContractByCurEnv(pool.lpAddress, ABI_UNI_V3_POS);
  }

  getV3PosNfts(
    pool: StonePoolInfo,
    nftIds: BigNumber[],
    stoneToken: string,
    removeZeroLiquidity?: boolean
  ): Observable<UniSwapV3PosNft[]> {
    const nftPosContract$: Observable<Contract> = this.getV3NftPosContract(pool);

    return combineLatest([nftPosContract$, from(nftIds)]).pipe(
      mergeMap(([nftPosContract, nftId]) => {

        return uniSwapV3PositionNftGetter(nftPosContract, nftId, stoneToken);
      }),
      toArray(),
      map((posList: UniSwapV3PosNft[]) => {
        return removeZeroLiquidity ? posList.filter(pos => pos.liquidity.gt(0)) : posList;
      })
    );
  }

  getV3PosNftStoneAmounts(pool: StonePoolInfo, nftIds: BigNumber[], stoneToken: string): Observable<SldDecimal> {
    const nftPosContract$: Observable<Contract> = this.getV3NftPosContract(pool);

    return combineLatest([nftPosContract$, from(nftIds)]).pipe(
      mergeMap(([posNftContract, nftId]) => {
        const nft$ = uniSwapV3PositionNftGetter(posNftContract, nftId, stoneToken);
        return nft$.pipe(
          switchMap(posNft => {
            return uniSwapPosNftAmountGetter(posNftContract, posNft);
          })
        );
      }),
      toArray(),
      map((nftAmounts: UniSwapV3PosNftAmount[]) => {
        const tokenAmountArr = nftAmounts.map((one: UniSwapV3PosNftAmount) => [one.amount0, one.amount1]);
        const tokenAmounts = _.flatten(tokenAmountArr);
        return tokenAmounts
          .filter(one => isSameAddress(one.token.address, stoneToken))
          .reduce((acc, cur) => {
            return acc.add(cur.amount);
          }, SldDecimal.ZERO);
      })
    );
  }

  // -------------------------------------------------------------------------------------------------------------------

  private increaseGas(contractGasFun: Function, ...args: any[]): Observable<{ gasLimit: BigNumber }> {
    return from(contractGasFun(...args) as Promise<BigNumber>).pipe(
      map((gas: BigNumber) => {
        return { gasLimit: BigNumber.from(Math.ceil(gas.toNumber() * 1.5)) };
      })
    );
  }

  private resBool(callRes: any): Observable<boolean> {
    return from(callRes.wait()).pipe(
      map(() => true),
      catchError(err => {
        console.log('err', err);
        return of(false);
      })
    );
  }
}

export const stoneService = new StoneService();
