import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick, padTimeStr } from '../../../../util/string';
import styles from './count-down.module.less';
import { curTimestamp, DeltaTime, displayDuration, EMPTY_DELTA_TIME } from '../../../../util/time';
import { interval, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { fontCss } from '../../../i18n/font-switch';
import { Visible } from '../../../builtin/hidden';
import { LoadingOutlined } from '@ant-design/icons';

type IState = {
  isMobile: boolean;
  delta: DeltaTime;
};
type IProps = {
  target: number | undefined;
  className?: string;
  useSeparator?: boolean;
};

export class CountDown extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    delta: EMPTY_DELTA_TIME,
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('delta', this.mergeDelta());
  }

  componentWillUnmount() {
    this.destroyState();
  }

  componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any) {
    if (prevProps.target !== this.props.target) {
      this.updateState({ delta: this.genDelta() });
    }
  }

  genDelta(): DeltaTime {
    let deltaSec = (this.props.target || 0) - curTimestamp();
    if (deltaSec < 0) {
      deltaSec = 0;
    }
    return displayDuration(deltaSec);
  }

  mergeDelta(): Observable<DeltaTime> {
    return interval(1000).pipe(
      startWith(0),
      map(() => {
        return this.genDelta();
      })
    );
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const useSeparator: boolean = !!this.props.useSeparator;

    return (
      <div
        className={styleMr(styles.wrapperCountdown, cssPick(useSeparator, styles.useSeparator), this.props.className)}
      >
        <div className={styleMr(styles.card, 'sld-countdown-card')}>
          <div className={styleMr(styles.num, fontCss.bold, 'sld-countdown-num')}>
            <Visible when={this.props.target !== undefined}>{padTimeStr(this.state.delta.days)}</Visible>

            <Visible when={this.props.target === undefined}>
              <LoadingOutlined />
            </Visible>
          </div>
          <div className={styleMr(styles.name, 'sld-countdown-name')}>DAY</div>
        </div>

        <Visible when={useSeparator}>
          <div className={styleMr(styles.sep)}>
            <div className={styleMr(styles.sign)}>
              <div className={styleMr(styles.point)} />
              <div className={styleMr(styles.point)} />
            </div>
            <div className={styleMr(styles.empty)} />
          </div>
        </Visible>

        <div className={styleMr(styles.card, 'sld-countdown-card')}>
          <div className={styleMr(styles.num, fontCss.bold, 'sld-countdown-num')}>
            <Visible when={this.props.target !== undefined}>{padTimeStr(this.state.delta.hours)}</Visible>

            <Visible when={this.props.target === undefined}>
              <LoadingOutlined />
            </Visible>
          </div>
          <div className={styleMr(styles.name, 'sld-countdown-name')}>HRS</div>
        </div>

        <Visible when={useSeparator}>
          <div className={styleMr(styles.sep)}>
            <div className={styleMr(styles.sign)}>
              <div className={styleMr(styles.point)} />
              <div className={styleMr(styles.point)} />
            </div>
            <div className={styleMr(styles.empty)} />
          </div>
        </Visible>

        <div className={styleMr(styles.card, 'sld-countdown-card')}>
          <div className={styleMr(styles.num, fontCss.bold, 'sld-countdown-num')}>
            <Visible when={this.props.target !== undefined}>{padTimeStr(this.state.delta.minutes)}</Visible>

            <Visible when={this.props.target === undefined}>
              <LoadingOutlined />
            </Visible>
          </div>
          <div className={styleMr(styles.name, 'sld-countdown-name')}>MIN</div>
        </div>

        <Visible when={useSeparator}>
          <div className={styleMr(styles.sep)}>
            <div className={styleMr(styles.sign)}>
              <div className={styleMr(styles.point)} />
              <div className={styleMr(styles.point)} />
            </div>
            <div className={styleMr(styles.empty)} />
          </div>
        </Visible>

        <div className={styleMr(styles.card, 'sld-countdown-card')}>
          <div className={styleMr(styles.num, fontCss.bold, 'sld-countdown-num')}>
            <Visible when={this.props.target !== undefined}>{padTimeStr(this.state.delta.seconds)}</Visible>

            <Visible when={this.props.target === undefined}>
              <LoadingOutlined />
            </Visible>
          </div>
          <div className={styleMr(styles.name, 'sld-countdown-name')}>SEC</div>
        </div>
      </div>
    );
  }
}
