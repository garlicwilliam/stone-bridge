import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './page-title.module.less';
import { ReactNode } from 'react';
import { fontCss } from '../../../i18n/font-switch';
import { Visible } from '../../../builtin/hidden';

type IState = {
  isMobile: boolean;
};
type IProps = {
  title: ReactNode;
  subTitle?: ReactNode;
};

export class PageTitle extends BaseStateComponent<IProps, IState> {
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
      <div className={styleMr(styles.wrapperTitle, fontCss.bold)}>
        <div className={styleMr(styles.mainTitle)}>{this.props.title}</div>

        <Visible when={!!this.props.subTitle}>
          <div className={styleMr(styles.subTitle, fontCss.regular)}>{this.props.subTitle}</div>
        </Visible>
      </div>
    );
  }
}
