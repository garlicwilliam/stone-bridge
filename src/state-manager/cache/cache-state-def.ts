import { normalParser, normalSerializer } from './cache-state-serializer';
import { CacheStateDefine } from '../interface';
import { StoneBridgeCrossCache } from '../state-types';

export const CACHE_STATE = {
  Stone: {
    Bridge: {
      Tx: {
        _key: '_bridge_stone_tx_',
        _isGlobal: false,
        _serializer: normalSerializer,
        _parser: normalParser,
      } as CacheStateDefine<StoneBridgeCrossCache>,
    },
  },
};
