import { RpcEvent, RpcMethod, WalletConnectOps, WcChainId } from '../../../constant/walletconnect';
import { CrossNetworks, SourceNetwork } from './const-var';
import { NetworkParams } from '../../../constant/network-conf';

const stoneSrcChains = SourceNetwork.map(s => WcChainId[s]);
const stoneCrsChains = CrossNetworks.map(s => WcChainId[s]);
const stoneRpcMap = CrossNetworks.map(s => {
  return { [WcChainId[s]]: NetworkParams[s].rpcUrls[0] };
}).reduce((acc, cur) => {
  return Object.assign(acc, cur);
}, {});

export const ops: WalletConnectOps = {
  initProviderOps: {
    projectId: '9155bc0988aa999a5bdf4069c4d050e7',
    metadata: {
      name: 'StakeStone',
      description: 'Stake, But More',
      url: 'https://stakestone.io',
      icons: [],
    },
    logger: 'error',
  },
  defaultChain: WcChainId[SourceNetwork[0]],
  connectOps: {
    namespaces: {
      eip155: {
        chains: stoneSrcChains,
        methods: RpcMethod,
        events: RpcEvent,
        rpcMap: stoneRpcMap,
      },
    },
    optionalNamespaces: {
      eip155: {
        chains: stoneCrsChains,
        methods: RpcMethod,
        events: RpcEvent,
        rpcMap: stoneRpcMap,
      },
    },
  },
};
