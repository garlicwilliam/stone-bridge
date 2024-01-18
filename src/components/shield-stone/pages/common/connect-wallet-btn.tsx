import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './connect-wallet-btn.module.less';
import { SldButton } from '../../../common/buttons/sld-button';
import { I18n } from '../../../i18n/i18n';

type IState = {
  isMobile: boolean;
};
type IProps = {};

export class ConnectWalletBtn extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  onConnect() {
    P.Layout.IsShowWalletModal.set(true);
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <SldButton
        size={this.state.isMobile ? 'large' : 'huge'}
        type={'none'}
        className={styleMr(styles.btn)}
        onClick={this.onConnect.bind(this)}
      >
        <I18n id={'com-connect-wallet'} />
      </SldButton>
    );
  }
}
