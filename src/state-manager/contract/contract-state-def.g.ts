import { genArgWrapper as wr, generatorCreator as gc } from './contract-state';
import { StonePoolHasStaked, StonePoolUserStartTime, UniSwapV3PosNft } from '../state-types';
import { walletState } from '../wallet/wallet-state';
import {
  erc20MiningStakedAmountGetter,
  miningCycleGetter,
  miningTerminatedGetter,
  miningUserNftCountGetter,
  miningUserPositionExistGetter,
  miningUserStartGetter,
  nftCountGetter,
  nftIdsGetter,
  nftLpMiningAssetsIdsGetter,
  nftLpMiningLockedGetter,
  posNftArrGetter,
  posNftLockedGetter,
} from './contract-getter-sim-stone';
import { SldDecimal } from '../../util/decimal';
import { erc20ApprovedAmountGetter, erc20UserBalanceGetter } from './contract-getter-sim-erc20';
import { BigNumber } from 'ethers';
import { stoneContracts } from '../../components/shield-stone/contract/stone-contract';
import { erc721IsApprovedAllGetter } from './contract-getter-sim-erc721';

export const SG = {
  Stone: {
    StakePool: {
      Common: {
        HasStaked: gc<StonePoolHasStaked, 'mining'>({
          _depends: [wr('mining'), walletState.USER_ADDR],
          _getter: miningUserPositionExistGetter,
        }),
        MiningTerminated: gc<boolean, 'mining'>({
          _depends: [wr('mining')],
          _getter: miningTerminatedGetter,
        }),
        MiningCycle: gc<number, 'mining'>({
          _depends: [wr('mining')],
          _getter: miningCycleGetter,
        }),
        MiningUserStart: gc<StonePoolUserStartTime, 'mining'>({
          _depends: [wr('mining'), walletState.USER_ADDR],
          _getter: miningUserStartGetter,
        }),
        MiningGNftCount: gc<number, 'mining'>({
          _depends: [wr('mining'), walletState.USER_ADDR],
          _getter: miningUserNftCountGetter,
        }),
      },
      Erc20: {
        Balance: gc<SldDecimal, 'erc20'>({
          _depends: [wr('erc20'), walletState.USER_ADDR],
          _getter: erc20UserBalanceGetter,
        }),
        MiningApproved: gc<SldDecimal, 'erc20' | 'mining'>({
          _depends: [walletState.USER_ADDR, wr('erc20'), wr('mining')],
          _getter: erc20ApprovedAmountGetter,
        }),
        MiningLocked: gc<SldDecimal, 'erc20' | 'mining'>({
          _depends: [wr('mining'), walletState.USER_ADDR, wr('erc20')],
          _getter: erc20MiningStakedAmountGetter,
        }),
        MiningCycle: gc<number, 'mining'>({
          _depends: [wr('mining')],
          _getter: miningCycleGetter,
        }),
      },
      Nft: {
        AssetIds: gc<BigNumber[], 'mining'>({
          _depends: [wr('mining'), walletState.USER_ADDR],
          _getter: nftLpMiningAssetsIdsGetter,
        }),
        AssetNFTs: gc<UniSwapV3PosNft[], 'nftContract' | 'mining'>({
          _depends: [
            wr('nftContract'),
            wr('mining'),
            stoneContracts.CONTRACTS_ADDRESS.stoneToken,
            walletState.USER_ADDR,
          ],
          _getter: posNftArrGetter,
        }),
        IsApproved: gc<boolean, 'nftContract' | 'mining'>({
          _depends: [wr('nftContract'), walletState.USER_ADDR, wr('mining')],
          _getter: erc721IsApprovedAllGetter,
        }),
        LockedIds: gc<BigNumber[], 'mining'>({
          _depends: [wr('mining'), walletState.USER_ADDR],
          _getter: nftLpMiningLockedGetter,
        }),
        LockedNFTs: gc<UniSwapV3PosNft[], 'nftContract' | 'mining'>({
          _depends: [
            wr('nftContract'),
            wr('mining'),
            stoneContracts.CONTRACTS_ADDRESS.stoneToken,
            walletState.USER_ADDR,
          ],
          _getter: posNftLockedGetter,
        }),
      },
    },
    GNft: {
      UserIds: gc<BigNumber[], 'nft'>({
        _depends: [wr('nft'), walletState.USER_ADDR],
        _getter: nftIdsGetter,
      }),
      UserOwned: gc<BigNumber, 'nft'>({
        _depends: [wr('nft'), walletState.USER_ADDR],
        _getter: nftCountGetter,
      }),
    },
  },
};
