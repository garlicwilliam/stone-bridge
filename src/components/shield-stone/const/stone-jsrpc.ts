import {
  NET_BNB,
  NET_BNB_TEST,
  NET_ETHEREUM,
  NET_GOERLI,
  NET_MANTA_PACIFIC,
  NET_MANTA_PACIFIC_TEST,
} from '../../../constant/network';
import { genRpcProviderGetter, RpcProviderGen } from '../../../state-manager/contract/contract-provider-utils';
import { AppName, getAppName } from '../../../util/app';

export const STONE_JSON_RPC_ENDPOINT = {
  [NET_ETHEREUM]: 'https://quick-old-isle.quiknode.pro/4cd6d7ff97b87b41071f5fae262aae8b9bb4841e/',
  [NET_GOERLI]: 'https://goerli.infura.io/v3/abc4c36a4ae54715bc7a4ecedd5a8490',
  [NET_MANTA_PACIFIC]: 'https://pacific-rpc.manta.network/http',
  [NET_MANTA_PACIFIC_TEST]: 'https://pacific-rpc.testnet.manta.network/http',
  [NET_BNB_TEST]: 'https://data-seed-prebsc-2-s2.binance.org:8545/',
  [NET_BNB]: 'https://bscrpc.com',
};

export const getStoneRpc: RpcProviderGen =
  getAppName() === AppName.Stone ? genRpcProviderGetter(STONE_JSON_RPC_ENDPOINT) : () => undefined;
