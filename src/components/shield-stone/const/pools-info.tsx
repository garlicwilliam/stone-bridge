import { StonePoolInfo } from '../../../state-manager/state-types';
import { NET_ETHEREUM, NET_GOERLI, NET_MANTA_PACIFIC } from '../../../constant/network';
import { envSelect, ExeEnv } from './const-var';
import { NetworkIcons } from '../../../constant/network-conf';

const POOL_INFO_PROD: StonePoolInfo[] = [
  {
    chainId: NET_ETHEREUM,
    chainIcon: 'https://static.shieldex.io/assets/imgs/tokens/eth1.svg',
    lpAddress: '0x7122985656e38BDC0302Db86685bb972b145bD3C',
    lpName: 'STONE',
    protocolIcon: 'https://static.shieldex.io/assets/imgs/stone/logo_stone.svg',
    protocolName: 'StakeStone',
    protocolUrl: 'https://stakestone.io',
    stakeType: 'erc20',

    miningAddress: '0x8f5420e76eEC29027800D4e3e8E879617bdE709b',
    gNftAddress: '0x129e49c0399E3C932D34c3b76A598214b5B82cf9',
    displayCheckId: 'StoneNftPool',
  },
  {
    chainId: NET_MANTA_PACIFIC,
    chainIcon: NetworkIcons[NET_MANTA_PACIFIC],
    protocolIcon: 'https://static.shieldex.io/assets/imgs/brands/quickperp.svg',
    protocolName: 'QuickSwap',
    protocolUrl: 'https://quickswap.exchange/',
    stakeType: 'nft',
    lpAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    lpName: 'STONE/WETH pool LP',
    miningAddress: '0x0FAC524F8cC56f693aB84fd30b888E38439cE43a',
    gNftAddress: '0x2B1D947f995Cdad9eE38AED2096C75fcbB47Ec8D',
  },
];
const POOL_INFO_TEST: StonePoolInfo[] = [
  {
    chainId: NET_GOERLI,
    chainIcon: 'https://static.shieldex.io/assets/imgs/tokens/eth1.svg',
    protocolIcon: 'https://static.shieldex.io/assets/imgs/tokens/uniswap.svg',
    protocolName: 'UniSwap',
    protocolUrl: 'https://stakestone.io',
    stakeType: 'nft',
    lpAddress: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    lpName: 'UNI_V3_POS',

    miningAddress: '0x409052F98636FF196b12119dE022Eb84090ECA55',
    gNftAddress: '0x5917AbcD3c144046BA92D46e572b67aa604eb9E9',
  },
  {
    chainId: NET_GOERLI,
    chainIcon: 'https://static.shieldex.io/assets/imgs/tokens/eth1.svg',
    protocolIcon: 'https://static.shieldex.io/assets/imgs/stone/logo_stone.svg',
    protocolName: 'StakeStone',
    protocolUrl: 'https://stakestone.io',
    stakeType: 'erc20',
    lpAddress: '0x1Aff5cd754f271b80b7598d4aA77a4F16363c515',
    lpName: 'STONE',

    miningAddress: '0x393d1242292E3cF5e5c25FB12198CD239dACF49E',
    gNftAddress: '0x7de4D07AC77a65d9Dc0e3890621b61984F7AA85B',
  },
];

export const POOL_INFO: StonePoolInfo[] = envSelect({
  [ExeEnv.Prod]: POOL_INFO_PROD,
  [ExeEnv.Alpha]: POOL_INFO_PROD,
  [ExeEnv.Test]: POOL_INFO_TEST,
});
