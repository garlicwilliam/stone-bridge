import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './loading.module.less';
import loading from '../../../../assets/imgs/common/loading1.svg';

type IState = {
  isMobile: boolean;
};
type IProps = {
  size?: number;
};

export class StoneLoading extends BaseStateComponent<IProps, IState> {
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
      <div className={styleMr(styles.loading)}>
        <img src={loading} alt={''} width={this.props.size} />
      </div>
    );
  }
}
