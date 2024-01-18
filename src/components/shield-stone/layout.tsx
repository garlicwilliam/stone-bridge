import { BaseStateComponent } from '../../state-manager/base-state-component';
import { P } from '../../state-manager/page/page-state-parser';
import { bindStyleMerger } from '../../util/string';
import styles from './layout.module.less';
import { Outlet } from 'react-router-dom';
import { VaultHead } from './pages/head/head';
import { ConnectWallet } from '../connect-wallet/connect-wallet';
import { EmptyProps, LocationProps, withLocation } from '../common/utils/location-wrapper';
import { AppendBodyContainer } from '../../services/append-body/append';
import { bgColorType, bgImgType, ColorTypeVarName, isNoFooter } from './routers/router-utils';
import React from 'react';
import { FooterMobile } from './pages/footer/footer-mobile';
import { Visible } from '../builtin/hidden';
import { setAppVariable } from '../../util/app';
import {StoneBgImgType, StoneColorType} from "../../state-manager/state-types";
import {ResultMask} from "../common/overlay/result-mask";

type IState = {
  isMobile: boolean;
  height: number;
  colorType: StoneColorType;
};
type IProps = EmptyProps & LocationProps;

class ShieldVaultLayoutImp extends BaseStateComponent<IProps, IState> {
  state: IState = {
    isMobile: P.Layout.IsMobile.get(),
    height: 0,
    colorType: P.Stone.ColorType.get(),
  };

  private resizeCallback = (entries: ResizeObserverEntry[]) => {
    const height = entries[0].borderBoxSize[0].blockSize;
    this.updateState({ height });
  };

  private sizeObserver: ResizeObserver = new ResizeObserver(this.resizeCallback);

  componentDidMount() {
    this.registerIsMobile('isMobile');
    this.registerState('colorType', P.Stone.ColorType);

    this.updateRouteInfo();
  }

  componentWillUnmount() {
    this.destroyState();
    this.sizeObserver.disconnect();
  }

  componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any) {
    this.updateRouteInfo();
  }

  updateRouteInfo() {
    this.setLocation(this.props.location);
    this.setNavParam(this.props.param);
    this.setNavigation(this.props.nav);

    this.updateColorType();
  }

  updateColorType() {
    const colorType: StoneColorType = bgColorType(this.props.location);

    setAppVariable<StoneColorType>(ColorTypeVarName, colorType);
    P.Stone.ColorType.set(colorType, true);
  }

  setDom(dom) {
    if (dom) {
      this.sizeObserver.observe(dom);
    }
  }

  private layoutBgImgCss(): string {
    let type: StoneBgImgType = bgImgType(this.props.location);

    if (type === StoneBgImgType.Normal && this.state.height < 1100) {
      type = StoneBgImgType.Short;
    }

    const css = {
      [StoneBgImgType.Short]: styles.short,
      [StoneBgImgType.Normal]: styles.normal,
      [StoneBgImgType.Stake]: styles.stake,
      [StoneBgImgType.Blank]: '',
    };

    const className = css[type];

    return className;
  }

  private footerCss(): string {
    return isNoFooter(this.props.location) ? styles.noBottomPadding : '';
  }

  render() {
    const mobileCss = this.state.isMobile ? styles.mobile : '';
    const styleMr = bindStyleMerger(mobileCss);

    const bgColorCss: string = this.state.colorType === StoneColorType.Color1 ? styles.color1 : styles.color2;
    const bgImgCss: string = this.layoutBgImgCss();
    const footerCss: string = this.footerCss();

    return (
      <>
        <div
          className={styleMr(styles.layout, footerCss, bgColorCss, bgImgCss)}
          ref={dom => {
            this.setDom(dom);
          }}
        >
          <VaultHead />

          <div>
            <Outlet />
          </div>

          <ConnectWallet
            manualPopup={true}
            connectionAgree={
              <div>
                By connecting a wallet, I read and agree to StakeStone's
                <br />
                <a href={'https://docs.stakestone.io/stakestone/additionals/terms-of-service'} target={'_blank'}>
                  Terms of Service
                </a>
                ,{' '}
                <a href={'https://docs.stakestone.io/stakestone/additionals/risks'} target={'_blank'}>
                  Risks
                </a>
                , and{' '}
                <a href={'https://docs.stakestone.io/stakestone/additionals/privacy-policy'} target={'_blank'}>
                  Privacy Policy
                </a>
              </div>
            }
          />

          <Visible when={this.state.isMobile}>
            <FooterMobile />
          </Visible>
        </div>

        <AppendBodyContainer />
        <ResultMask />
      </>
    );
  }
}

export const ShieldVaultLayout = withLocation(ShieldVaultLayoutImp);
