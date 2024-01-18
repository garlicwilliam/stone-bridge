import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './to-detail.module.less';
import { Link } from 'react-router-dom';
import { RouteKey } from '../../../../constant/routes';

type IState = {
  isMobile: boolean;
};
type IProps = {};

export class ToStakingDetail extends BaseStateComponent<IProps, IState> {
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
      <Link to={'/' + RouteKey.vaultStDetail}>
        <div className={styleMr(styles.wrapperGoto)}>
          <span>Try Pro Version &gt;&gt;</span>
        </div>
      </Link>
    );
  }
}
