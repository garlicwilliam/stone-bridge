import { Location } from 'react-router-dom';
import { RouteKey } from '../../../constant/routes';
import * as _ from 'lodash';
import { Network } from '../../../constant/network';
import { CrossNetworks, SourceNetwork } from '../const/const-var';
import { StoneBgImgType, StoneColorType } from '../../../state-manager/state-types';

export const ColorTypeVarName: string = 'colorType' as const;

const color1TypeRoutes = [RouteKey.stake, RouteKey.stoneEco, RouteKey.gauge];

export function bgColorType(location?: Location): StoneColorType {
  if (!location) {
    return StoneColorType.Color1;
  }

  const path = _.trimStart(location.pathname, '/');
  const isColor1 = color1TypeRoutes.some(one => path.startsWith(one));

  return isColor1 ? StoneColorType.Color1 : StoneColorType.Color2;
}

const blankImgRoutes = [RouteKey.portfolio, RouteKey.rewards + '/reward', RouteKey.gNft, RouteKey.gauge];

export function bgImgType(location?: Location): StoneBgImgType {
  if (!location) {
    return StoneBgImgType.Blank;
  }

  const path: string = _.trimStart(location.pathname, '/');

  const isStake: boolean = path.startsWith(RouteKey.stake);
  if (isStake) {
    return StoneBgImgType.Stake;
  }

  const isBlank: boolean = blankImgRoutes.some(one => path.startsWith(one));
  if (isBlank) {
    return StoneBgImgType.Blank;
  }

  return StoneBgImgType.Normal;
}

const noFooterRoutes: RouteKey[] = [RouteKey.gNft];

export function isNoFooter(location?: Location): boolean {
  if (!location) {
    return false;
  }

  const path: string = _.trimStart(location.pathname, '/');
  return noFooterRoutes.some((route: RouteKey) => path.startsWith(route));
}

const crossNetSupportRoutes: RouteKey[] = [RouteKey.gNft, RouteKey.bridge, RouteKey.stoneEco];

export function supportNets(location?: Location): Network[] {
  const singleNet: Network[] = SourceNetwork;
  const multipleNet: Network[] = CrossNetworks;

  if (!location) {
    return singleNet;
  }

  const path: string = _.trimStart(location.pathname, '/');
  const isCross: boolean = crossNetSupportRoutes.some(route => path.startsWith(route));

  return isCross ? multipleNet : singleNet;
}
