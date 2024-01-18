import {
  NET_ARBITRUM,
  NET_ARBITRUM_GOERLI,
  NET_BASE,
  NET_BASE_GOERLI,
  NET_BNB,
  NET_BNB_TEST,
  NET_ETHEREUM,
  NET_GOERLI,
  NET_LINEA,
  NET_LINEA_GOERLI,
  NET_MANTA_PACIFIC,
  NET_MANTA_PACIFIC_TEST,
  NET_MANTLE,
  NET_MANTLE_TEST,
  Network,
} from '../../../constant/network';

// layer zero define
export const CrossChainIdMap: { [s: string]: number } = {
  [NET_GOERLI]: 10121,
  [NET_ARBITRUM_GOERLI]: 10143,
  [NET_BNB_TEST]: 10102,
  [NET_LINEA_GOERLI]: 10157,
  [NET_MANTLE_TEST]: 10181,
  [NET_ETHEREUM]: 101,
  [NET_ARBITRUM]: 110,
  [NET_BNB]: 102,
  [NET_LINEA]: 183,
  [NET_MANTLE]: 181,
  [NET_BASE]: 184,
  [NET_BASE_GOERLI]: 10160,
  [NET_MANTA_PACIFIC]: 217,
  [NET_MANTA_PACIFIC_TEST]: 10221,
};

export const CrossChainIdToNet: { [i: number]: Network } = Object.keys(CrossChainIdMap)
  .map((key: string) => {
    const id: number = CrossChainIdMap[key];
    return { [id]: key as Network };
  })
  .reduce((acc, cur) => {
    return Object.assign(acc, cur);
  }, {});
