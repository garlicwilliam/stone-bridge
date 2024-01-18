import { BaseStateComponent } from '../../../../../state-manager/base-state-component';
import { P } from '../../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../../util/string';
import styles from './menu-list.module.less';
import { ShieldMenuList } from '../../../../common/menu/menu-list';
import { RouteKey } from '../../../../../constant/routes';
import { I18n } from '../../../../i18n/i18n';
import React from 'react';

type IState = {
  isMobile: boolean;
};
type IProps = {};

export class StoneMenuList extends BaseStateComponent<IProps, IState> {
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
      <ShieldMenuList
        menus={[
          // { router: RouteKey.stake, content: <I18n id={'stone-menu-stake'} /> },
          // { router: RouteKey.stoneEco, content: <I18n id={'stone-menu-eco'} /> },
          // { router: RouteKey.gNft, content: <I18n id={'stone-menu-nft'} /> },
          // { router: RouteKey.rewards, content: <I18n id={'menu-rewards'} /> },
          // { router: RouteKey.portfolio, content: <I18n id={'stone-menu-portfolio'} /> },
          // { router: RouteKey.gauge, content: <I18n id={'menu-gauge'} /> },
          { router: RouteKey.bridge, content: <I18n id={'stone-menu-bridge'} /> },
        ]}
      />
    );
  }
}
