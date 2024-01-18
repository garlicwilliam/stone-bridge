import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick, StyleMerger } from '../../../../util/string';
import styles from './stone-input.module.less';
import { DecimalNumInput } from '../../../common/input/num-input-decimal';
import { ReactNode } from 'react';
import ssEth from '../../../../assets/imgs/tokens/stone.svg';
import { HorizonItem } from '../../../common/content/horizon-item';
import { I18n } from '../../../i18n/i18n';
import { TokenAmountInline } from '../../../common/content/token-amount-inline';
import { TOKEN_SYMBOL } from '../../../../constant/tokens';
import { SldDecimal } from '../../../../util/decimal';
import { fontCss } from '../../../i18n/font-switch';
import { i18n } from '../../../i18n/i18n-fn';
import { NetworkIcons } from '../../../../constant/network-conf';
import { NET_ETHEREUM, Network } from '../../../../constant/network';
import { Visible } from '../../../builtin/hidden';

type IState = {
  isMobile: boolean;
  isError: boolean;
};

type IProps = {
  max: SldDecimal; // max allowed user input
  maxBalance: SldDecimal; // wallet balance
  min?: SldDecimal;
  placeholder?: string;
  onChange?: (val: SldDecimal | null) => void;
  value?: SldDecimal | null;
  defaultVal?: SldDecimal;
  icon?: string;
  className?: string;
  onError?: (isError) => void;
  disabled?: boolean;
  curNetwork?: Network | null;
};

export class StoneInput extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    isError: false,
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  genPrefix(styleMr: StyleMerger): ReactNode {
    return (
      <div className={styleMr(styles.prefix)}>
        <span className={styleMr(styles.icon)}>
          <img src={ssEth} alt={''} width={this.state.isMobile ? 18 : 22} />
        </span>
        <span className={styleMr(styles.name)}>STONE</span>
      </div>
    );
  }

  onMax(val: SldDecimal | undefined) {
    this.onValChange(val || null);
  }

  onReset() {
    if (this.props.defaultVal) {
      this.onValChange(this.props.defaultVal);
    } else {
      this.onValChange(null);
    }
  }

  onValChange(val: SldDecimal | null) {
    if (this.props.onChange) {
      this.props.onChange(val);
    }
  }

  onErrChange(isError: boolean) {
    this.updateState({ isError });
    if (this.props.onError) {
      this.props.onError(isError);
    }
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <div
        className={styleMr(
          styles.wrapperSSETHInput,
          'stone-input',
          this.props.className,
          cssPick(this.state.isError, styles.error, 'stone-input-error')
        )}
      >
        <DecimalNumInput
          originDecimal={18}
          isDark={false}
          noBorder={true}
          prefix={this.genPrefix(styleMr)}
          inputClassName={styleMr(styles.formInput, fontCss.bold)}
          className={styleMr(styles.formInputWrapper)}
          align={'right'}
          max={this.props.max}
          min={this.props.min}
          value={this.props.value}
          placeholder={
            this.props.placeholder
              ? this.props.placeholder
              : i18n('com-max') + ' ' + this.props.max.format({ fix: 4, floor: true })
          }
          onChange={this.onValChange.bind(this)}
          onErrorChange={this.onErrChange.bind(this)}
          disabled={this.props.disabled}
        />

        <div className={styleMr(styles.balance)}>
          <HorizonItem
            label={
              <>
                <Visible when={!!this.props.curNetwork}>
                  <img src={NetworkIcons[this.props.curNetwork || NET_ETHEREUM]} alt={''} height={14} />
                </Visible>

                <I18n id={this.state.isMobile ? 'stone-balance' : 'stone-available-balance'} />
              </>
            }
            align={'left'}
            labelClass={styleMr(styles.balanceLabel)}
            valueClass={styleMr(styles.balanceValue)}
            separator={':'}
          >
            <TokenAmountInline amount={this.props.maxBalance} token={TOKEN_SYMBOL.STONE} fix={4} round={-1} />
          </HorizonItem>

          <div className={styleMr(styles.rightAction)}>
            <div className={styleMr(styles.max)} onClick={() => this.onReset()}>
              <I18n id={'stone-reset'} textUpper={'uppercase'} />
            </div>

            <div className={styleMr(styles.max)} onClick={() => this.onMax(this.props.max)}>
              <I18n id={'com-max'} textUpper={'uppercase'} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
