import './entry-var';
import { addAppListener, addBodyClass, initAppVariable } from '../../../util/app';
import { ColorTypeVarName } from '../routers/router-utils';
import { updateMobileMode } from '../../../state-manager/page/page-state-parser';
import {StoneColorType} from "../../../state-manager/state-types";

function colorTypeCallback(type: StoneColorType): void {
  const [addName, delName] = type === StoneColorType.Color1 ? ['color1', 'color2'] : ['color2', 'color1'];
  addBodyClass(addName, delName);
}

initAppVariable(ColorTypeVarName, StoneColorType.Color1).subscribe(colorTypeCallback);
addAppListener('resize', updateMobileMode);
