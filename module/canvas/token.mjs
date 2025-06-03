export default class AbbrewToken extends (foundry.canvas?.placeables?.Token ?? Token) {

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
    }

    _onClickLeft(event) {
        console.log(event);
        super._onClickLeft(event);
    }

    _onClickLeft2(event) {
        console.log(event);
        super._onClickLeft2(event);
    }

    _canView(user, event) {
        return true;
    }

    // _createInteractionManager() {

    //     // Handle permissions to perform various actions
    //     const permissions = {
    //         hoverIn: this._canHover,
    //         clickLeft: this._canControl,
    //         clickLeft2: this._canView,
    //         clickRight: this._canHUD,
    //         clickRight2: this._canConfigure,
    //         dragStart: this._canDrag,
    //         dragLeftStart: this._canDragLeftStart
    //     };

    //     // Define callback functions for each workflow step
    //     const callbacks = {
    //         hoverIn: this._onHoverIn,
    //         hoverOut: this._onHoverOut,
    //         clickLeft: this._onClickLeft,
    //         clickLeft2: this._onClickLeft2,
    //         clickRight: this._onClickRight,
    //         clickRight2: this._onClickRight2,
    //         unclickLeft: this._onUnclickLeft,
    //         unclickRight: this._onUnclickRight,
    //         dragLeftStart: this._onDragLeftStart,
    //         dragLeftMove: this._onDragLeftMove,
    //         dragLeftDrop: this._onDragLeftDrop,
    //         dragLeftCancel: this._onDragLeftCancel,
    //         dragRightStart: this._onDragRightStart,
    //         dragRightMove: this._onDragRightMove,
    //         dragRightDrop: this._onDragRightDrop,
    //         dragRightCancel: this._onDragRightCancel,
    //         longPress: this._onLongPress
    //     };

    //     // Define options
    //     const options = { target: this.controlIcon ? "controlIcon" : null };

    //     // Create the interaction manager
    //     return new MouseInteractionManager(this, canvas.stage, permissions, callbacks, options);
    // }
}