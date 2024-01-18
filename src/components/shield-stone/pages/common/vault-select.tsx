import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, StyleMerger } from '../../../../util/string';
import styles from './vault-select.module.less';
import { SldSelect, SldSelectOption } from '../../../common/selects/select';
import { ReactNode } from 'react';
import { I18n } from '../../../i18n/i18n';

export type OptionParam = { vaultAddress: string; vaultName: string };

type IState = {
  isMobile: boolean;
  options: SldSelectOption[];
};
type IProps = {
  options: OptionParam[];
  curSelected: OptionParam | undefined;
  onSelect?: (selected: OptionParam) => void;
};

export class VaultSelect extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    options: [],
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  genOptions(styleMr: StyleMerger): SldSelectOption[] {
    return this.props.options.map((option: OptionParam) => {
      return {
        value: option.vaultAddress,
        label: <div className={styleMr(styles.optionItem)}>{option.vaultName}</div>,
        labelActive: (
          <div className={styleMr(styles.optionSelectedItem)}>
            <div className={styleMr(styles.from)}>From</div>
            <div className={styleMr(styles.vault)}>{option.vaultName}</div>
          </div>
        ),
        object: option,
      } as SldSelectOption;
    });
  }

  genEmpty(styleMr: StyleMerger): ReactNode {
    return (
      <div className={styleMr(styles.empty)}>
        <I18n id={'stone-stake-vault-unstake-empty'} />
      </div>
    );
  }

  onSelect(opParam: OptionParam) {
    if (this.props.onSelect) {
      this.props.onSelect(opParam);
    }
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const options = this.genOptions(styleMr);
    const selected: OptionParam | undefined = this.props.curSelected
      ? this.props.curSelected
      : this.props.options.length > 0
      ? this.props.options[0]
      : undefined;

    return (
      <div className={styleMr(styles.wrapperVaultSelect)}>
        <SldSelect
          isDark={true}
          noBorder={true}
          options={options}
          dropdownClassName={styleMr(styles.optionDropdown)}
          curSelected={selected?.vaultAddress}
          emptyReplace={this.genEmpty(styleMr)}
          isDisabled={!this.props.options || this.props.options.length === 0}
          onChangeSelect={(op: SldSelectOption) => this.onSelect(op.object)}
        />
      </div>
    );
  }
}
