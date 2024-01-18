import { SldDecPercent } from '../../../util/decimal';
import {
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

export const PERCENT_DECIMAL: number = 6;

export enum ExeEnv {
  Prod = 'Prod',
  Alpha = 'Alpha',
  Test = 'Test',
}
export const curExeEnv: ExeEnv = ExeEnv.Prod;

export function envSelect<T>(options: { [k in ExeEnv]: T }): T {
  return options[curExeEnv];
}

export const SourceNetwork: Network[] = envSelect({
  [ExeEnv.Prod]: [NET_ETHEREUM],
  [ExeEnv.Alpha]: [NET_ETHEREUM],
  [ExeEnv.Test]: [NET_GOERLI],
});
export const CrossNetworks: Network[] = envSelect({
  [ExeEnv.Prod]: [NET_BNB, NET_MANTA_PACIFIC],
  [ExeEnv.Alpha]: [NET_ETHEREUM, NET_LINEA, NET_MANTLE, NET_BNB, NET_BASE],
  [ExeEnv.Test]: [NET_GOERLI, NET_LINEA_GOERLI, NET_MANTLE_TEST, NET_BNB_TEST, NET_BASE_GOERLI, NET_MANTA_PACIFIC_TEST],
});
