import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, StyleMerger } from '../../../../util/string';
import styles from './network-switch.module.less';
import { Network } from '../../../../constant/network';
import { SldSelect, SldSelectOption } from '../../../common/selects/select';
import { ReactNode } from 'react';
import { walletState } from '../../../../state-manager/wallet/wallet-state';
import { NetworkIcons, NetworkLabels } from '../../../../constant/network-conf';
import { I18n } from '../../../i18n/i18n';
import ModalRender from '../../../modal-render';
import { SldButton } from '../../../common/buttons/sld-button';
import { fontCss } from '../../../i18n/font-switch';

type IState = {
  isMobile: boolean;
};

type IProps = {
  current?: Network;
  supports: Network[];
  showLabel?: boolean;
  className?: string;
  selectClassName?: string;
  dropdownClassName?: string;
};

export class HeadNetworkSwitch extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  genOptions(styleMr: StyleMerger): SldSelectOption[] {
    return this.props.supports.map((one: Network): SldSelectOption => {
      return {
        value: one,
        label: (
          <div className={styleMr(styles.item)}>
            <div className={styleMr(styles.iconImg)}>
              <img src={NetworkIcons[one]} alt={''} height={20} />
            </div>
            <span>{NetworkLabels[one]}</span>
          </div>
        ),
        labelActive: (
          <div className={styleMr(styles.activeItem)}>
            <img src={NetworkIcons[one]} alt={''} height={20} />
            {!this.props.showLabel ? <></> : <span>{NetworkLabels[one]}</span>}
          </div>
        ),
      };
    });
  }

  notSupport(styleMr: StyleMerger): ReactNode {
    return (
      <div className={styleMr(styles.notSupport, 'network_not_support')}>
        <I18n id={'stone-network-wrong'} />
      </div>
    );
  }

  onSelect(network: Network) {
    walletState.switchNetwork(network);
  }

  isWrongNetwork(): boolean {
    return this.props.current !== undefined && this.props.supports.indexOf(this.props.current) < 0;
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const isW = this.isWrongNetwork();

    return (
      <>
        <div className={styleMr(styles.wrapperSwitch, this.props.className)}>
          <SldSelect
            noBorder={true}
            options={this.genOptions(styleMr)}
            isDark={false}
            curSelected={this.props.current}
            className={styleMr(styles.height, this.props.selectClassName)}
            dropdownClassName={styleMr(this.props.dropdownClassName)}
            isFlex={true}
            placement={'bottom-end'}
            emptyReplace={this.notSupport(styleMr)}
            noMatchReplace={this.notSupport(styleMr)}
            onChangeSelect={(op: SldSelectOption) => this.onSelect(op.value as Network)}
            offset={4}
          />

          <ModalRender title={<I18n id={'stone-on-wrong-network'} />} footer={null} closable={false} visible={isW}>
            <div className={styleMr(styles.modalDesc)}>
              <I18n id={'stone-on-wrong-network-switch'} params={{ chain: this.props.current }} />
            </div>

            <div>
              <div className={styleMr(styles.modalBtnTitle, fontCss.bold)}>Switch To</div>
              <div className={styleMr(styles.modalBtnList)}>
                {this.props.supports.map((chainId: Network) => {
                  return (
                    <SldButton
                      key={chainId}
                      size={'large'}
                      type={'default'}
                      className={styleMr(styles.btnDefault)}
                      onClick={() => {
                        this.onSelect(chainId);
                      }}
                    >
                      <div className={styleMr(styles.modalBtnContent)}>
                        <img src={NetworkIcons[chainId]} height={24} alt={''} /> {NetworkLabels[chainId]}
                      </div>
                    </SldButton>
                  );
                })}
              </div>
            </div>
          </ModalRender>
        </div>
      </>
    );
  }
}
