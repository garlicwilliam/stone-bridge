import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, padTimeStr } from '../../../../util/string';
import styles from './count-down2.module.less';
import { interval, Observable } from 'rxjs';
import { curTimestamp, DeltaTime, displayDuration, EMPTY_DELTA_TIME } from '../../../../util/time';
import { map } from 'rxjs/operators';
import { fontCss } from '../../../i18n/font-switch';

type IState = {
  isMobile: boolean;
  deltaTime: DeltaTime;
};
type IProps = {
  target: number;
};

export class CountDown2 extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    deltaTime: EMPTY_DELTA_TIME,
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('deltaTime', this.mergeDelta());
  }

  componentWillUnmount() {
    this.destroyState();
  }

  mergeDelta(): Observable<DeltaTime> {
    return interval(1000).pipe(
      map(() => {
        let delta: number = this.props.target - curTimestamp();
        delta = delta < 0 ? 0 : delta;

        return displayDuration(delta);
      })
    );
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <div className={styleMr(styles.wrapperCount)}>
        <div className={styleMr(styles.oneCard)}>
          <div className={styleMr(styles.card, fontCss.bold)}>{padTimeStr(this.state.deltaTime.hours)}</div>
          <div className={styleMr(styles.unit)}>h</div>
        </div>

        <div className={styleMr(styles.oneCard)}>
          <div className={styleMr(styles.card, fontCss.bold)}>{padTimeStr(this.state.deltaTime.minutes)}</div>
          <div className={styleMr(styles.unit)}>m</div>
        </div>

        <div className={styleMr(styles.oneCard)}>
          <div className={styleMr(styles.card, fontCss.bold)}>{padTimeStr(this.state.deltaTime.seconds)}</div>
          <div className={styleMr(styles.unit, styles.last)}>s</div>
        </div>
      </div>
    );
  }
}
