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

}