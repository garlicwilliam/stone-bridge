import { BaseStateComponent } from '../../../state-manager/base-state-component';
import { P } from '../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../util/string';
import { FixPadding } from '../../common/content/fix-padding';
import { fontCss } from '../../i18n/font-switch';
import { SldButton } from '../../common/buttons/sld-button';
import styles from './404.module.less';
import { RouteKey } from '../../../constant/routes';

type IState = {
  isMobile: boolean;
};
type IProps = {};

export class NotFound extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  toHome() {
    this.navigateTo(RouteKey.stake);
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <FixPadding top={150} bottom={0} mobTop={80} mobBottom={0}>
        <div className={styleMr(styles.wrapper)}>
          <div className={styleMr(styles.wrapperMain, fontCss.bold)}>404</div>
          <div className={styleMr(styles.wrapperText)}>Oops, page not found.</div>
          <SldButton
            size={this.state.isMobile ? 'small' : 'large'}
            type={'none'}
            className={styleMr(styles.btn, styles.wrapperBtn)}
            onClick={this.toHome.bind(this)}
          >
            Back Home
          </SldButton>
        </div>
      </FixPadding>
    );
  }
}
