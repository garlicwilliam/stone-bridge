import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../../util/string';
import styles from './logo.module.less';
import logo from '../../../../../assets/imgs/logo/shield/logo-black.svg';
import mobileLogo from '../../../../../assets/imgs/logo/shield/logo-mobile.svg';
import stone from '../../../../../assets/imgs/logo/stone/stone.svg';
import { Visible } from '../../../../builtin/hidden';

type IState = {
  isMobile: boolean;
};
type IProps = {};

export class VaultLogo extends BaseStateComponent<IProps, IState> {
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

    return (
      <div className={styleMr(styles.wrapperLogo)}>
        <Visible when={this.state.isMobile}>
          <img src={stone} alt={''} height={28} />
          {/*<div className={styleMr(styles.beta)}>*/}
          {/*  <div className={styleMr(styles.arrow)} />*/}
          {/*  Beta*/}
          {/*</div>*/}
        </Visible>

        <Visible when={!this.state.isMobile}>
          <img src={stone} alt={''} height={30} />
          {/*<div className={styleMr(styles.beta)}>*/}
          {/*  <div className={styleMr(styles.arrow)} />*/}
          {/*  Beta*/}
          {/*</div>*/}
        </Visible>
      </div>
    );
  }
}
