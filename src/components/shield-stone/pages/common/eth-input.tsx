import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick, StyleMerger } from '../../../../util/string';
import styles from './eth-input.module.less';
import { DecimalNumInput } from '../../../common/input/num-input-decimal';
import { ETH_DECIMAL } from '../../../../constant';
import { ReactNode } from 'react';
import { TOKEN_SYMBOL } from '../../../../constant/tokens';
import { HorizonItem } from '../../../common/content/horizon-item';
import { I18n } from '../../../i18n/i18n';
import { TokenAmountInline } from '../../../common/content/token-amount-inline';
import { SldDecimal } from '../../../../util/decimal';
import { fontCss } from '../../../i18n/font-switch';
import { walletState } from '../../../../state-manager/wallet/wallet-state';
import { i18n } from '../../../i18n/i18n-fn';

type IState = {
  isMobile: boolean;
  maxBalance: SldDecimal;
  isError: boolean;
};

type IProps = {
  min?: SldDecimal;
  max?: SldDecimal;
  onChange?: (val: SldDecimal | null) => void;
  value?: SldDecimal;
  defaultVal?: SldDecimal;
  placeholder?: string;
  disabled?: boolean;
  onError?: (isError: boolean) => void;
};

export class EthInput extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    maxBalance: SldDecimal.ZERO,
    isError: true,
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerObservable('maxBalance', walletState.NATIVE_BALANCE);
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private genMax(): SldDecimal {
    return SldDecimal.max(this.state.maxBalance, this.props.max || SldDecimal.ZERO);
  }

  private genPrefix(styleMr: StyleMerger): ReactNode {
    const url: string = 'https://static.shieldex.io/assets/imgs/tokens/eth2.svg';

    return (
      <div className={styleMr(styles.prefix)}>
        <span className={styleMr(styles.icon)}>
          <img src={url} alt={''} height={this.state.isMobile ? 20 : 26} />
        </span>
        <span className={styleMr(styles.name, fontCss.medium)}>{TOKEN_SYMBOL.ETH.description}</span>
      </div>
    );
  }

  private genMaxPlaceholder(): string {
    return this.state.maxBalance.gtZero()
      ? i18n('com-max') + ' ' + this.state.maxBalance.format({ fix: 4, floor: true })
      : i18n('stone-insufficient-balance');
  }

  private onMax(max: SldDecimal) {
    if (this.props.onChange) {
      this.props.onChange(max);
    }
  }

  private onErrorChange(isError: boolean) {
    this.updateState({ isError });
    if (this.props.onError) {
      this.props.onError(isError);
    }
  }

  private onReset() {
    if (!this.props.onChange) {
      return;
    }

    if (this.props.defaultVal) {
      this.props.onChange(this.props.defaultVal);
    } else {
      this.props.onChange(null);
    }
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const maxVal: SldDecimal = this.genMax();

    return (
      <div className={styleMr(styles.wrapperEthInput, cssPick(this.state.isError, styles.error))}>
        <DecimalNumInput
          originDecimal={ETH_DECIMAL}
          isDark={false}
          align={'right'}
          noBorder={true}
          prefix={this.genPrefix(styleMr)}
          inputClassName={styleMr(styles.formInput, fontCss.bold)}
          className={styleMr(styles.formInputWrapper)}
          max={maxVal}
          min={this.props.min || SldDecimal.ZERO}
          value={this.props.value}
          onChange={this.props.onChange}
          placeholder={this.props.placeholder || this.genMaxPlaceholder()}
          onErrorChange={this.onErrorChange.bind(this)}
          disabled={this.props.disabled}
        />

        <div className={styleMr(styles.balance)}>
          <HorizonItem
            label={this.state.isMobile ? <I18n id={'stone-balance'} /> : <I18n id={'stone-available-balance'} />}
            align={'left'}
            labelClass={styleMr(styles.balanceLabel)}
            valueClass={styleMr(styles.balanceValue)}
          >
            <TokenAmountInline amount={this.state.maxBalance} token={TOKEN_SYMBOL.ETH} fix={4} round={-1} />
          </HorizonItem>

          <div className={styleMr(styles.rightAction)}>
            <div className={styleMr(styles.max)} onClick={() => this.onReset()}>
              <I18n id={'stone-reset'} textUpper={'uppercase'} />
            </div>

            <div className={styleMr(styles.max)} onClick={() => this.onMax(maxVal)}>
              <I18n id={'com-max'} textUpper={'uppercase'} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
