import{At as Sv,E as Ga,Hn as qa,Jn as rr,Ln as nr,On as le,P as IE,Pn as me,T as G,U as L,fr as y,jn as m,ln as be,lr as wv,qt as Y,vt as Qe,zn as p}from"./chunk-DZPK9dU2.js";import{i as V$1,r as P$1}from"./chunk-B29SHdUJ.js";import{E as ye,g as di}from"./chunk-BHAuBv2F.js";import{E as oo,i as Ge,s as Le}from"./chunk-CL9A24Fg.js";import{c as X,i as K}from"./chunk-OvwKSTC9.js";function j(i,m){}var I=`_mat-bottom-sheet-enter`;var F=`_mat-bottom-sheet-exit`;var z=(()=>{class i extends K{_breakpointSubscription;_animationsDisabled=di();_animationState=`void`;_animationStateChanged=new le;_destroyed=!1;constructor(){super();let e=p(P$1);this._breakpointSubscription=e.observe([V$1.Medium,V$1.Large,V$1.XLarge]).subscribe(()=>{let n=this._elementRef.nativeElement.classList;n.toggle(`mat-bottom-sheet-container-medium`,e.isMatched(V$1.Medium)),n.toggle(`mat-bottom-sheet-container-large`,e.isMatched(V$1.Large)),n.toggle(`mat-bottom-sheet-container-xlarge`,e.isMatched(V$1.XLarge))})}enter(){this._destroyed||(this._animationState=`visible`,this._changeDetectorRef.markForCheck(),this._changeDetectorRef.detectChanges(),this._animationsDisabled&&this._simulateAnimation(I))}exit(){this._destroyed||(this._elementRef.nativeElement.setAttribute(`mat-exit`,``),this._animationState=`hidden`,this._changeDetectorRef.markForCheck(),this._animationsDisabled&&this._simulateAnimation(F))}ngOnDestroy(){super.ngOnDestroy(),this._breakpointSubscription.unsubscribe(),this._destroyed=!0}_simulateAnimation(e){this._ngZone.run(()=>{this._handleAnimationEvent(!0,e,this._elementRef.nativeElement),setTimeout(()=>this._handleAnimationEvent(!1,e,this._elementRef.nativeElement))})}_trapFocus(){super._trapFocus({preventScroll:!0})}_handleAnimationEvent(e,n,t){if(t===this._elementRef.nativeElement){let o=n===I;(o||n===F)&&this._animationStateChanged.emit({toState:o?`visible`:`hidden`,phase:e?`start`:`done`})}}static ɵfac=function(n){return new(n||i)};static ɵcmp=nr({type:i,selectors:[[`mat-bottom-sheet-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-bottom-sheet-container`],hostVars:9,hostBindings:function(n,t){n&1&&Ga(`animationstart`,function(a){return t._handleAnimationEvent(!0,a.animationName,a.target)})(`animationend`,function(a){return t._handleAnimationEvent(!1,a.animationName,a.target)})(`animationcancel`,function(a){return t._handleAnimationEvent(!1,a.animationName,a.target)}),n&2&&(rr(`role`,t._config.role)(`aria-modal`,t._config.ariaModal)(`aria-label`,t._config.ariaLabel),qa(`mat-bottom-sheet-container-animations-enabled`,!t._animationsDisabled)(`mat-bottom-sheet-container-enter`,t._animationState===`visible`)(`mat-bottom-sheet-container-exit`,t._animationState===`hidden`))},features:[wv],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(n,t){n&1&&Sv(0,j,0,0,`ng-template`,0)},dependencies:[oo],styles:[`@keyframes _mat-bottom-sheet-enter {
  from {
    transform: translateY(100%);
  }
  to {
    transform: none;
  }
}
@keyframes _mat-bottom-sheet-exit {
  from {
    transform: none;
  }
  to {
    transform: translateY(100%);
  }
}
.mat-bottom-sheet-container {
  box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);
  padding: 8px 16px;
  min-width: 100vw;
  box-sizing: border-box;
  display: block;
  outline: 0;
  max-height: 80vh;
  overflow: auto;
  position: relative;
  background: var(--%NS%mat-bottom-sheet-container-background-color, var(--%NS%mat-sys-surface-container-low));
  color: var(--%NS%mat-bottom-sheet-container-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-bottom-sheet-container-text-font, var(--%NS%mat-sys-body-large-font));
  font-size: var(--%NS%mat-bottom-sheet-container-text-size, var(--%NS%mat-sys-body-large-size));
  line-height: var(--%NS%mat-bottom-sheet-container-text-line-height, var(--%NS%mat-sys-body-large-line-height));
  font-weight: var(--%NS%mat-bottom-sheet-container-text-weight, var(--%NS%mat-sys-body-large-weight));
  letter-spacing: var(--%NS%mat-bottom-sheet-container-text-tracking, var(--%NS%mat-sys-body-large-tracking));
}
@media (forced-colors: active) {
  .mat-bottom-sheet-container {
    outline: 1px solid;
  }
}

.mat-bottom-sheet-container-animations-enabled {
  transform: translateY(100%);
}
.mat-bottom-sheet-container-animations-enabled.mat-bottom-sheet-container-enter {
  animation: _mat-bottom-sheet-enter 195ms cubic-bezier(0, 0, 0.2, 1) forwards;
}
.mat-bottom-sheet-container-animations-enabled.mat-bottom-sheet-container-exit {
  animation: _mat-bottom-sheet-exit 375ms cubic-bezier(0.4, 0, 1, 1) backwards;
}

.mat-bottom-sheet-container-xlarge, .mat-bottom-sheet-container-large, .mat-bottom-sheet-container-medium {
  border-top-left-radius: var(--%NS%mat-bottom-sheet-container-shape, 28px);
  border-top-right-radius: var(--%NS%mat-bottom-sheet-container-shape, 28px);
}

.mat-bottom-sheet-container-medium {
  min-width: 384px;
  max-width: calc(100vw - 128px);
}

.mat-bottom-sheet-container-large {
  min-width: 512px;
  max-width: calc(100vw - 256px);
}

.mat-bottom-sheet-container-xlarge {
  min-width: 576px;
  max-width: calc(100vw - 384px);
}
`],encapsulation:2,changeDetection:1})}return i})();var P=new y(`MatBottomSheetData`);var b=class{viewContainerRef;injector;panelClass;direction;data=null;hasBackdrop=!0;backdropClass;disableClose=!1;ariaLabel=null;ariaModal=!1;closeOnNavigation=!0;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;height=``;minHeight;maxHeight;bindings};var d=class{_ref;get instance(){return this._ref.componentInstance}get componentRef(){return this._ref.componentRef}containerInstance;disableClose;_afterOpened=new Y;_result;_closeFallbackTimeout;constructor(m,e,n){this._ref=m,this.containerInstance=n,this.disableClose=e.disableClose,n._animationStateChanged.pipe(be(t=>t.phase===`done`&&t.toState===`visible`),Qe(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),n._animationStateChanged.pipe(be(t=>t.phase===`done`&&t.toState===`hidden`),Qe(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._ref.close(this._result)}),m.overlayRef.detachments().subscribe(()=>{this._ref.close(this._result)}),IE(this.backdropClick(),this.keydownEvents().pipe(be(t=>t.keyCode===27))).subscribe(t=>{!this.disableClose&&(t.type!==`keydown`||!ye(t))&&(t.preventDefault(),this.dismiss())})}dismiss(m){this.containerInstance&&(this.containerInstance._animationStateChanged.pipe(be(e=>e.phase===`start`),Qe(1)).subscribe(()=>{this._closeFallbackTimeout=setTimeout(()=>this._ref.close(this._result),500),this._ref.overlayRef.detachBackdrop()}),this._result=m,this.containerInstance.exit(),this.containerInstance=null)}afterDismissed(){return this._ref.closed}afterOpened(){return this._afterOpened}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}};var V=new y(`mat-bottom-sheet-default-options`);var lt=(()=>{class i{_injector=p(me);_parentBottomSheet=p(i,{optional:!0,skipSelf:!0});_animationsDisabled=di();_defaultOptions=p(V,{optional:!0});_bottomSheetRefAtThisLevel=null;_dialog=p(X);get _openedBottomSheetRef(){let e=this._parentBottomSheet;return e?e._openedBottomSheetRef:this._bottomSheetRefAtThisLevel}set _openedBottomSheetRef(e){this._parentBottomSheet?this._parentBottomSheet._openedBottomSheetRef=e:this._bottomSheetRefAtThisLevel=e}open(e,n){let t=m(m({},this._defaultOptions||new b),n),o;return this._dialog.open(e,L(m({},t),{disableClose:!0,closeOnOverlayDetachments:!1,maxWidth:`100%`,container:z,scrollStrategy:t.scrollStrategy||Le(this._injector),positionStrategy:Ge(this._injector).centerHorizontally().bottom(`0`),disableAnimations:this._animationsDisabled,templateContext:()=>({bottomSheetRef:o}),providers:(a,X,L)=>(o=new d(a,t,L),[{provide:d,useValue:o},{provide:P,useValue:t.data}])})),o.afterDismissed().subscribe(()=>{this._openedBottomSheetRef===o&&(this._openedBottomSheetRef=null)}),this._openedBottomSheetRef?(this._openedBottomSheetRef.afterDismissed().subscribe(()=>o.containerInstance?.enter()),this._openedBottomSheetRef.dismiss()):o.containerInstance.enter(),this._openedBottomSheetRef=o,o}dismiss(e){this._openedBottomSheetRef&&this._openedBottomSheetRef.dismiss(e)}ngOnDestroy(){this._bottomSheetRefAtThisLevel&&this._bottomSheetRefAtThisLevel.dismiss()}static ɵfac=function(n){return new(n||i)};static ɵprov=G({token:i,factory:i.ɵfac})}return i})();export{d as n,lt as r,P as t};