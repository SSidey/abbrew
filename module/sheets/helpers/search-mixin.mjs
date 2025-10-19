export const SearchMixin = superclass => class extends superclass {

    /* In implementing class:
       Add to _onRender(context, options) | this.registerSearch(inputSelector, contentSelector);
       Add an _onSearchFilter method to handle filtering.
    */
    constructor(args) {
        super(args);
    }

    search;

    _onSearchFilter() {
        ui.notifications.error("No _onSearchFilter provided in implementing class");
    }

    registerSearch(inputSelector, contentSelector) {
        this.search = new foundry.applications.ux.SearchFilter({
            inputSelector: inputSelector,
            contentSelector: contentSelector,
            callback: this._onSearchFilter.bind(this)
        });
        this.search.bind(this.element);
    }

    _tearDown(options) {
        super._tearDown(options);
        this.search?.unbind();
    }
}