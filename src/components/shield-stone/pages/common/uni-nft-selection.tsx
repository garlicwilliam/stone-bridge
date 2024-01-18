import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger, cssPick, styleMerge } from '../../../../util/string';
import styles from './uni-nft-selection.module.less';
import { Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { Visible } from '../../../builtin/hidden';
import { StonePoolInfo, UniSwapV3PosNft, TokenErc20 } from '../../../../state-manager/state-types';
import { PendingHolder } from '../../../common/progress/pending-holder';
import { stoneContracts } from '../../contract/stone-contract';
import { walletState } from '../../../../state-manager/wallet/wallet-state';
import { Network } from '../../../../constant/network';
import { isSameAddress } from '../../../../util/address';
import { ReactNode } from 'react';
import { SldDecPrice } from '../../../../util/decimal';

type OState = {
  isMobile: boolean;
};
type OProps = {
  nftPos: UniSwapV3PosNft;
  checked: boolean;
  onCheck: (checked: { isCheck: boolean; id: string }) => void;

  poolInfo: StonePoolInfo;
};

class UniNftItem extends BaseStateComponent<OProps, OState> {
  state: OState = {
    isMobile: P.Layout.IsMobile.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private onChange(event: CheckboxChangeEvent) {
    const checked = event.target.checked;
    const id: string = event.target.id as string;

    this.props.onCheck({ isCheck: checked, id });
  }

  private genPairLabel(token0: TokenErc20, token1: TokenErc20): ReactNode {
    const network: Network | null = walletState.getCurNetwork();
    if (!network) {
      return '';
    }

    const stoneAddress: string | undefined = stoneContracts.getContractAddress(network, 'stoneToken');

    return isSameAddress(token0.address, stoneAddress || '') ? (
      <span className={styleMerge()}>
        <span>{token0.symbol}</span> {' / ' + token1.symbol}
      </span>
    ) : (
      <span className={styleMerge()}>
        <span>{token1.symbol}</span> {' / ' + token0.symbol}
      </span>
    );
  }

  private priceFormat(price: SldDecPrice | 'MAX' | 'MIN'): string {
    if (typeof price === 'string') {
      return price === 'MAX' ? '∞' : '0.0';
    } else {
      return price.format({ fix: 5, floor: true });
    }
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);
    const disabled = this.props.nftPos.liquidity.eq(0);

    return (
      <div className={styleMr(styles.optionItem, cssPick(disabled, styles.disabled))}>
        <div className={styleMr(styles.op)}>
          <Checkbox
            disabled={disabled}
            id={this.props.nftPos.id.toString()}
            onChange={this.onChange.bind(this)}
            checked={this.props.checked}
          />
        </div>

        <div className={styleMr(styles.id)}>
          <div className={styleMr(styles.num)}>#{this.props.nftPos.id.toString()}</div>
          <div className={styleMr(styles.pair)}>
            {this.genPairLabel(this.props.nftPos.token0, this.props.nftPos.token1)}
          </div>
        </div>

        <div className={styleMr(styles.price)}>
          <div className={styleMr(styles.title)}>Min Price</div>
          <div className={styleMr(styles.value)}>{this.priceFormat(this.props.nftPos.minBasePrice)}</div>
        </div>

        <div className={styleMr(styles.price)}>
          <div className={styleMr(styles.title)}>Max Price</div>
          <div className={styleMr(styles.value)}>{this.priceFormat(this.props.nftPos.maxBasePrice)}</div>
        </div>

        <div className={styleMr(styles.fee)}>
          <div className={styleMr(styles.title)}>Fee Tier</div>
          <div className={styleMr(styles.value)}>{this.props.nftPos.feeRate.percentFormat()}%</div>
        </div>
      </div>
    );
  }
}

type IState = {
  isMobile: boolean;
};
type IProps = {
  nftArr: UniSwapV3PosNft[];
  checked: Set<string>;
  onChange: (checked: Set<string>) => void;
  poolInfo: StonePoolInfo;
  isLoading: boolean;
};

export class UniNftSelect extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private onChange(checked: { id: string; isCheck: boolean }) {
    const newState = new Set(Array.from(this.props.checked));

    if (checked.isCheck) {
      newState.add(checked.id);
    } else {
      newState.delete(checked.id);
    }

    this.props.onChange(newState);
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    return (
      <div>
        <div className={styleMr(styles.nftSelect)}>
          {this.props.isLoading ? (
            <div>
              <PendingHolder loading={true} useIcon={true} />
            </div>
          ) : (
            <>
              {this.props.nftArr.map(pos => {
                const idStr: string = pos.id.toString();
                return (
                  <UniNftItem
                    key={idStr}
                    nftPos={pos}
                    checked={this.props.checked.has(idStr)}
                    onCheck={this.onChange.bind(this)}
                    poolInfo={this.props.poolInfo}
                  />
                );
              })}
            </>
          )}

          <Visible when={!this.props.isLoading && !!this.props.nftArr && this.props.nftArr.length === 0}>
            <div className={styleMr(styles.noData)}>You do not have any tokens.</div>
          </Visible>
        </div>
      </div>
    );
  }
}
