import { AppName, getAppName } from '../util/app';
import { ops as StoneOps } from '../components/shield-stone/const/wallet-connect';
import { WalletConnectOps } from './walletconnect';

const appName: AppName = getAppName();

let wcOps: WalletConnectOps;

switch (appName) {
  case AppName.Stone: {
    wcOps = StoneOps;
    break;
  }
}

export { wcOps };
