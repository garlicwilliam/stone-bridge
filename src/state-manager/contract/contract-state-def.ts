import { walletState } from '../wallet/wallet-state';
import { isObservable, NEVER, Observable, of } from 'rxjs';
import { ContractState, ContractStateTree, StateReference } from '../interface';
import _ from 'lodash';
import { filter, map, switchMap } from 'rxjs/operators';
import { P } from '../page/page-state-parser';
import { erc20ApprovedAmountGetter, erc20UserBalanceGetter } from './contract-getter-sim-erc20';
import { linkAnswerGetter } from './contract-getter-sim-link';
import {
  miningUserPositionExistGetter2,
  proposalDetailGetter,
  proposalInfoListGetter,
  proposalUserVoteAmountGetter,
  stoneApyDataGetter,
  stoneAssetsContract,
  stoneAssetsEthBalanceGetter,
  stoneCrossCapacity,
  stoneCrossFeesGetter,
  stoneEthPriceGetter,
  stoneIdleEth,
  stoneInstantWithdrawReceiveGetter,
  stoneTokenContract,
  stoneTotalSupply,
  stoneTvlGetter,
  stoneUserInfoGetter,
  stoneVaultApyGetter,
  stoneVaultExitFeeRate,
  stoneVaultLastRoundGetter,
  stoneVaultLastRoundPriceGetter,
  stoneVaultSharePriceGetter,
  strategyAllValidValueGetter,
  strategyAllValueGetter,
  strategyInfoListGetter,
} from './contract-getter-sim-stone';
import { stoneContracts } from '../../components/shield-stone/contract/stone-contract';
import { ETH_DECIMAL, STONE_DECIMAL } from '../../constant';
import { nativeBalanceGetter } from './contract-getter-sim-native';
import { NET_ETHEREUM } from '../../constant/network';
import { getStoneRpc } from '../../components/shield-stone/const/stone-jsrpc';
import { createChainContract } from '../const/contract-creator';
import { STONE_ABI } from '../../components/shield-stone/const/stone-abi';
import { ethers } from 'ethers';

class StateHolder implements StateReference {
  private treeRoot: ContractStateTree<any> | null = null;

  constructor(private path: string | Observable<string>) {}

  public getRef(): Observable<any> {
    return this.curRefState().pipe(
      switchMap((state: ContractState<any>) => {
        return state.watch() as Observable<any>;
      })
    );
  }

  public watchCurState(): Observable<ContractState<any>> {
    return this.curRefState().pipe(filter(Boolean));
  }

  private curPath(): Observable<string> {
    return isObservable(this.path) ? this.path : of(this.path);
  }

  private curRefState(): Observable<ContractState<any>> {
    return this.curPath().pipe(
      switchMap((path: string) => {
        if (this.treeRoot && _.has(this.treeRoot, path)) {
          const curState = _.get(this.treeRoot, path) as ContractState<any>;
          return of(curState);
        } else {
          console.warn('state reference can not get a instance.', this.treeRoot, this.path);
          return NEVER;
        }
      })
    );
  }

  setRoot(root: ContractStateTree<any>) {
    this.treeRoot = root;
    return this;
  }
}

function Ref(path: string | Observable<string>): StateReference {
  return new StateHolder(path);
}

export const CONTRACT_STATE = {
  Stone: {
    Tvl: {
      _depend: [stoneContracts.CONTRACTS.strategyController],
      _getter: stoneTvlGetter,
    },
    StoneTvl: {
      _depend: [
        of(
          createChainContract(
            stoneContracts.getContractAddress(NET_ETHEREUM, 'strategyController') as string,
            STONE_ABI.strategyController,
            getStoneRpc(NET_ETHEREUM) as ethers.providers.Provider,
            NET_ETHEREUM
          )
        ),
      ],
      _getter: stoneTvlGetter,
    },
    curSharePrice: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneVaultSharePriceGetter,
    },
    CurStonePrice: {
      _depend: [
        of(
          createChainContract(
            stoneContracts.getContractAddress(NET_ETHEREUM, 'stoneVault') as string,
            STONE_ABI.stoneVault,
            getStoneRpc(NET_ETHEREUM) as ethers.providers.Provider,
            NET_ETHEREUM
          )
        ),
      ],
      _getter: stoneVaultSharePriceGetter,
    },
    LastRound: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneVaultLastRoundGetter,
    },
    lastRoundPrice: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneVaultLastRoundPriceGetter,
    },
    EthPrice: {
      _depend: [
        of(
          createChainContract(
            stoneContracts.getContractAddress(NET_ETHEREUM, 'ethOracle') as string,
            STONE_ABI.ethOracle,
            getStoneRpc(NET_ETHEREUM) as ethers.providers.Provider,
            NET_ETHEREUM
          )
        ),
      ],
      _getter: stoneEthPriceGetter,
    },
    StoneVaultApyData: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneApyDataGetter,
    },
    StoneVaultApprove: {
      _depend: [
        walletState.USER_ADDR,
        stoneContracts.CONTRACTS.stoneToken,
        stoneContracts.CONTRACTS.stoneVault,
        of(STONE_DECIMAL),
      ],
      _getter: erc20ApprovedAmountGetter,
    },
    StoneVaultUserInfo: {
      _depend: [stoneContracts.CONTRACTS.stoneVault, walletState.USER_ADDR],
      _getter: stoneUserInfoGetter,
    },
    StoneTokenContract: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneTokenContract,
    },
    StoneAssetsContract: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneAssetsContract,
    },
    StoneAssetsEth: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneAssetsEthBalanceGetter,
    },
    StoneIdleEth: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneIdleEth,
    },
    StoneUserBalance: {
      _depend: [stoneContracts.CONTRACTS.stoneToken, walletState.USER_ADDR, of(STONE_DECIMAL)],
      _getter: erc20UserBalanceGetter,
    },
    StoneApy: {
      _depend: [stoneContracts.CONTRACTS.stoneVault, of(24 * 3600 * 180)],
      _getter: stoneVaultApyGetter,
    },
    StonePoolHasPosition: {
      _depend: [of('0x8f5420e76eEC29027800D4e3e8E879617bdE709b'), of(getStoneRpc(NET_ETHEREUM)), walletState.USER_ADDR],
      _getter: miningUserPositionExistGetter2,
    },
    StoneTotalSupply: {
      _depend: [of(stoneContracts.getContractAddress(NET_ETHEREUM, 'stoneToken')), of(getStoneRpc(NET_ETHEREUM))],
      _getter: stoneTotalSupply,
    },
    StoneExitFee: {
      _depend: [stoneContracts.CONTRACTS.stoneVault],
      _getter: stoneVaultExitFeeRate,
    },
    StoneInstantUnstake: {
      Receive: {
        _depend: [stoneContracts.CONTRACTS.stoneVault, P.Stone.Unstake.Instant.Amount],
        _getter: stoneInstantWithdrawReceiveGetter,
      },
    },
    StrategyList: {
      _depend: [stoneContracts.CONTRACTS.strategyController],
      _getter: strategyInfoListGetter,
    },
    StrategyAllEthValue: {
      _depend: [stoneContracts.CONTRACTS.strategyController],
      _getter: strategyAllValueGetter,
    },
    StrategyAllValidEthValue: {
      _depend: [stoneContracts.CONTRACTS.strategyController],
      _getter: strategyAllValidValueGetter,
    },
    ProposalList: {
      _depend: [stoneContracts.CONTRACTS.proposal],
      _getter: proposalInfoListGetter,
    },
    ProposalDetail: {
      _depend: [stoneContracts.CONTRACTS.proposal, P.Stone.ProposalDetailId.watch().pipe(filter(Boolean))],
      _getter: proposalDetailGetter,
    },
    ProposalDetailUserVoted: {
      _depend: [
        stoneContracts.CONTRACTS.proposal,
        walletState.USER_ADDR,
        P.Stone.ProposalDetailId.watch().pipe(filter(Boolean)),
      ],
      _getter: proposalUserVoteAmountGetter,
    },
    ProposalApprove: {
      _depend: [
        walletState.USER_ADDR,
        stoneContracts.CONTRACTS.stoneToken,
        stoneContracts.CONTRACTS.proposal,
        of(STONE_DECIMAL),
      ],
      _getter: erc20ApprovedAmountGetter,
    },
    AssetsEthBalance: {
      _depend: [walletState.watchWeb3Provider(), Ref('Stone.StoneAssetsContract'), of(ETH_DECIMAL)],
      _getter: nativeBalanceGetter,
    },
    BridgeCrossFee: {
      _depend: [
        stoneContracts.CONTRACTS.stoneToken,
        P.Stone.BridgeCross.TargetNetwork,
        walletState.USER_ADDR,
        P.Stone.BridgeCross.StoneAmount,
      ],
      _getter: stoneCrossFeesGetter,
    },
    BridgeCrossCap: {
      _depend: [stoneContracts.CONTRACTS.stoneToken],
      _getter: stoneCrossCapacity,
    },
    BridgeStandardBalance: {
      _depend: [stoneContracts.STANDARD_BRIDGE_STONE_CONTRACT, walletState.USER_ADDR, of(STONE_DECIMAL)],
      _getter: erc20UserBalanceGetter,
    },
  },
};
