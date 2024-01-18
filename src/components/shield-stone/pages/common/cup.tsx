import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './cup.module.less';

type IState = {
  isMobile: boolean;
};
type IProps = {
  rank: number;
};

const colors: { [r: number]: string } = {
  1: '#735B3A',
  2: '#79714F',
  3: '#74767B',
};

export class Cup extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const rankCss: string = this.props.rank === 1 ? styles.rank1 : this.props.rank === 2 ? styles.rank2 : styles.rank3;

    return (
      <div className={styleMr(styles.wrapperCup, rankCss)}>
        <svg width={'50%'} height={'50%'} viewBox="0 0 16 22" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter
              x="-230.0%"
              y="-230.0%"
              width="560.0%"
              height="560.0%"
              filterUnits="objectBoundingBox"
              id="filter-1"
            >
              <feOffset dx="0" dy="0" in="SourceAlpha" result="shadowOffsetOuter1" />
              <feGaussianBlur stdDeviation="30" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
              <feColorMatrix
                values="0 0 0 0 0.901960784   0 0 0 0 0.823529412   0 0 0 0 0.541176471  0 0 0 0.150929271 0"
                type="matrix"
                in="shadowBlurOuter1"
                result="shadowMatrixOuter1"
              />
              <feMerge>
                <feMergeNode in="shadowMatrixOuter1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g id="final" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Stakestone-Finished-Rounds" fill={colors[this.props.rank]}>
              <g id="group-13" transform="translate(-17, -14)">
                <path
                  d="M31.6287876,14.5833333 L31.6287876,16.6666667 L35.4166664,16.6666667 L35.4166664,20.8333333
                      C35.4171491,23.5763629 33.483458,25.8496615 30.9952649,26.03125 C30.0442717,28.2436288
                      28.1487517,29.78465 25.9469696,30.1354167 L25.9463333,32.4403333 L29.7348483,32.4404762
                      L29.7348483,35.4166667 L20.2651516,35.4166667 L20.2651516,32.4404762 L24.0523333,32.4403333
                      L24.0530302,30.1354167 C21.8512481,29.78465 19.9557281,28.2436288 19.0047349,26.03125
                      C16.5165419,25.8496615 14.5828507,23.5763629 14.5833334,20.8333333 L14.5833334,16.6666667
                      L18.3712122,16.6666667 L18.3712122,14.5833333 L31.6287876,14.5833333 Z M18.3712122,18.75
                      L16.4772729,18.75 L16.4772729,20.8333333 C16.4772729,22.2135417 17.2916668,23.3854167
                      18.4185607,23.7989583 C18.3867368,23.5061688 18.3709255,23.2115413 18.3712122,22.9166667
                      L18.3712122,18.75 Z M33.522727,18.75 L31.6287876,18.75 L31.6287876,22.9166667
                      C31.6287876,23.215625 31.6126892,23.5104167 31.5814391,23.7989583 C32.7411406,23.3727382
                      33.5229995,22.1783247 33.522727,20.8333333 L33.522727,18.75 Z"
                  id="shape"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }
}
