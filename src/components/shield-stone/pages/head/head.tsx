import { BaseStateComponent } from '../../../../state-manager/base-state-component';
import { P } from '../../../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../../../util/string';
import styles from './head.module.less';
import { VaultLogo } from './sub-components/logo';
import { Visible } from '../../../builtin/hidden';
import { Location } from 'react-router-dom';
import { StoneHeaderWallet } from './sub-components/stone-header-wallet';
import React from 'react';
import { StoneMenuList } from './sub-components/menu-list';
import {StoneColorType} from "../../../../state-manager/state-types";

type IState = {
  isMobile: boolean;
  location?: Location;
  color?: StoneColorType;
};
type IProps = {};

export class VaultHead extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    location: undefined,
    color: P.Stone.ColorType.get(),
  };

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerNavLocation('location');
    this.registerState('color', P.Stone.ColorType);
  }

  componentWillUnmount() {
    this.destroyState();
  }

  private genColorCss(): string {
    return this.state.color === StoneColorType.Color1 ? styles.color1 : styles.color2;
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);
    const bgColorCss = this.genColorCss();

    return (
      <div className={styleMr(styles.wrapperHead, bgColorCss)}>
        <VaultLogo />

        {/*<VaultMenus />*/}
        <StoneMenuList />

        <Visible when={!this.state.isMobile}>
          <StoneHeaderWallet />
        </Visible>
      </div>
    );
  }
}
