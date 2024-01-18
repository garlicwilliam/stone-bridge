import { StoneApyPrimaryData } from '../../../state-manager/state-types';
import { SldDecimal, SldDecPercent } from '../../../util/decimal';
import { DECIMAL18, E18 } from '../../../constant';

export function computeApy(data: StoneApyPrimaryData[]): SldDecPercent {
  if (data.length < 2) {
    return SldDecPercent.ZERO;
  }

  const maxPeriod: number = 365 * 24 * 3600;

  const end = data[data.length - 1];
  let begin: StoneApyPrimaryData;
  let i = 0;
  do {
    begin = data[i];
    i++;
  } while (end.time - begin.time > maxPeriod);

  const year: number = 365 * 24 * 3600;
  const deltaPrice: SldDecimal = end.price.sub(begin.price);
  const deltaTime: number = end.time - begin.time;

  const multipleTimes: SldDecimal = SldDecimal.fromNumeric((year / deltaTime).toFixed(10), 18);
  const yearDeltaPrice: SldDecimal = deltaPrice.mul(multipleTimes.toE18()).div(E18);

  const apr = SldDecPercent.fromArgs(begin.price, yearDeltaPrice);

  return apr;
}

export function computeStoneApy(
  startTime: number,
  endTime: number,
  startPrice: SldDecimal,
  endPrice: SldDecimal
): SldDecPercent {
  const year: number = 365 * 24 * 3600;
  const deltaPrice: SldDecimal = endPrice.sub(startPrice);
  const deltaTime: number = endTime - startTime;

  if (deltaTime === 0) {
    return SldDecPercent.ZERO;
  }

  const timesNumStr: string = (year / deltaTime).toFixed(10);
  const multipleTimes: SldDecimal = SldDecimal.fromNumeric(timesNumStr, DECIMAL18);
  let yearDeltaPrice: SldDecimal = deltaPrice.mul(multipleTimes.toE18()).div(E18);

  if (!yearDeltaPrice.gtZero()) {
    yearDeltaPrice = SldDecimal.ZERO;
  }

  return SldDecPercent.fromArgs(startPrice, yearDeltaPrice);
}
