import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick } from '../../../../util/string';
import styles from './stone-input-2.module.less';
import { SldDecimal, SldDecPercent } from '../../../../util/decimal';
import { DecimalNumInput } from '../../../common/input/num-input-decimal';
import { STONE_DECIMAL } from '../../../../constant';
import { i18n } from '../../../i18n/i18n-fn';
import { ReactNode } from 'react';
import { I18n } from '../../../i18n/i18n';

type IState = {
  isMobile: boolean;
  isError: boolean;
};

type IProps = {
  max: SldDecimal;
  onChange?: (val: SldDecimal | null) => void;
  curValue?: SldDecimal | null;
  label?: ReactNode;
  useNegMargin?: boolean;
  errorChange?: (isError: boolean) => void;
  disabled?: boolean;
};

export class StoneInput2 extends BaseStateComponent<IProps, IState> {
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

  onValChange(val: SldDecimal | null) {
    if (this.props.onChange) {
      this.props.onChange(val);
    }
  }

  onMax(percentNum: number) {
    if (this.props.disabled) {
      return;
    }

    const percent: SldDecPercent = SldDecPercent.genPercent(percentNum.toString(), 18);
    const amount: SldDecimal = percent.applyTo(this.props.max);

    if (amount.isZero()) {
      this.onValChange(null);
    } else {
      this.onValChange(amount);
    }
  }

  onClear() {
    this.onValChange(null);
  }

  onError(isError: boolean) {
    this.updateState({ isError });
    if (this.props.errorChange) {
      this.props.errorChange(isError);
    }
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <div
        className={styleMr(
          styles.wrapperInput,
          cssPick(this.state.isError, styles.error),
          cssPick(this.props.useNegMargin, styles.margin)
        )}
      >
        <DecimalNumInput
          originDecimal={STONE_DECIMAL}
          noBorder={true}
          align={'right'}
          min={SldDecimal.ZERO}
          max={this.props.max}
          placeholder={i18n('com-max') + ' ' + this.props.max.format({ fix: 4, floor: true })}
          value={this.props.curValue}
          onChange={(val: SldDecimal | null) => this.onValChange(val)}
          prefix={this.props.label}
          onErrorChange={this.onError.bind(this)}
          disabled={this.props.disabled}
        />

        <div className={styleMr(styles.balance)}>
          <div
            className={styleMr(styles.tag, cssPick(this.props.disabled, styles.disabled))}
            onClick={() => this.onClear()}
          >
            <span>Reset</span>
          </div>

          <div
            className={styleMr(styles.tag, cssPick(this.props.disabled, styles.disabled))}
            onClick={() => this.onMax(25)}
          >
            <span>25%</span>
          </div>
          <div
            className={styleMr(styles.tag, cssPick(this.props.disabled, styles.disabled))}
            onClick={() => this.onMax(50)}
          >
            <span>50%</span>
          </div>
          <div
            className={styleMr(styles.tag, cssPick(this.props.disabled, styles.disabled))}
            onClick={() => this.onMax(75)}
          >
            <span>75%</span>
          </div>
          <div
            className={styleMr(styles.tag, cssPick(this.props.disabled, styles.disabled))}
            onClick={() => this.onMax(100)}
          >
            <I18n id={'com-max'} textUpper={'uppercase'} />
          </div>
        </div>
      </div>
    );
  }
}
