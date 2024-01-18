import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import styles from './form-footer.module.less';
import { ReactNode } from 'react';
import { bindStyleMerger, cssPick } from '../../../../util/string';
import { SldButton } from '../../../common/buttons/sld-button';

type IProps = {
  doneName: ReactNode;
  cancelName: ReactNode;
  onDone: () => void;
  onCancel: () => void;
  loading?: boolean;
  disabled?: boolean;
  noMargin?: boolean;
};
type IState = {
  isMobile: boolean;
};

export class FormFooter extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: false,
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
      <div className={styleMr(styles.footerWrapper, mobileCss)}>
        <SldButton
          size={this.state.isMobile ? 'large' : 'large'}
          type={'default'}
          onClick={this.props.onCancel.bind(this)}
          className={styleMr(styles.cancel)}
        >
          {this.props.cancelName}
        </SldButton>

        <SldButton
          size={this.state.isMobile ? 'large' : 'large'}
          type={'none'}
          disabled={this.props.disabled}
          onClick={this.props.onDone.bind(this)}
          className={styleMr(styles.confirm, styles.btn, cssPick(this.props.disabled, styles.disabled))}
        >
          {this.props.doneName}
        </SldButton>
      </div>
    );
  }
}
