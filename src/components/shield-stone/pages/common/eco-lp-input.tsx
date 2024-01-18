import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick } from '../../../../util/string';
import styles from './eco-lp-input.module.less';
import { SldSelect, SldSelectOption } from '../../../common/selects/select';
import { SldDecimal } from '../../../../util/decimal';
import { DecimalNumInput } from '../../../common/input/num-input-decimal';
import { I18n } from '../../../i18n/i18n';
import { fontCss } from '../../../i18n/font-switch';
import { i18n } from '../../../i18n/i18n-fn';
import { HorizonItem } from '../../../common/content/horizon-item';

type IState = {
  isMobile: boolean;
  isError: boolean;
};

type IProps = {
  lpOptions: SldSelectOption[];
  curLp?: string;
  onChangeLp?: (op: SldSelectOption) => void;
  lpDecimal?: number;
  maxBalance: SldDecimal;
  curAmount?: SldDecimal | null;
  onChangeAmount?: (val: SldDecimal | null) => void;
};

export class EcoLpInput extends BaseStateComponent<IProps, IState> {
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

  onChangeValue(val: SldDecimal | null) {
    if (this.props.onChangeAmount) {
      this.props.onChangeAmount(val);
    }
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <div className={styleMr(styles.wrapperLpInput, cssPick(this.state.isError, styles.error))}>
        <div className={styleMr(styles.input)}>
          <DecimalNumInput
            originDecimal={this.props.lpDecimal || 18}
            noBorder={true}
            max={this.props.maxBalance}
            min={SldDecimal.ZERO}
            inputClassName={styleMr(styles.formInput, fontCss.medium)}
            className={styleMr(styles.formInputWrapper)}
            placeholder={i18n('com-max') + ' ' + this.props.maxBalance.format({ fix: 4 })}
            onErrorChange={isError => this.updateState({ isError })}
            onChange={val => this.onChangeValue(val)}
            value={this.props.curAmount || null}
          />
        </div>

        <div className={styleMr(styles.select)}>
          <SldSelect
            options={this.props.lpOptions}
            emptyReplace={<div className={styleMr(styles.emptyOption)}>Select Lp Token</div>}
            noMatchReplace={<div className={styleMr(styles.emptyOption)}>Select Lp Token</div>}
            noBorder={true}
            className={styleMr(styles.formSelect)}
          />
        </div>

        <div className={styleMr(styles.available)}>
          <HorizonItem label={<I18n id={'stone-available-balance'} />} align={'left'} separator={': '}>
            <span className={styleMr(styles.maxNum)} onClick={() => this.onChangeValue(this.props.maxBalance)}>
              {this.props.maxBalance.format({ fix: 4 })}
            </span>
          </HorizonItem>
        </div>
      </div>
    );
  }
}
