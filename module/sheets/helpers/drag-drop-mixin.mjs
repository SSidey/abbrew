const { DragDrop } = foundry.applications.ux;

export const DragDropMixin = superclass => class extends superclass {
    constructor(args) {
        super(args);
        this.dragDrop = this.createDragDropHandlers();
    }

    dragDrop;

    // Optional: Add getter to access the private property

    /**
     * Returns an array of DragDrop instances
     * @type {DragDrop[]}
     */
    get dragDrop() {
        return this.dragDrop;
    };

    bindDragDrops() {
        this.dragDrop.forEach((d) => d.bind(this.element));
    }

    /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
    createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            };
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: d.callbacks?.drop.bind(this) ?? this._onDrop.bind(this),
            };
            return new DragDrop(d);
        });
    };

    /**
     * Callback actions which occur at the beginning of a drag start workflow.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
    */
    async _onDragStart(event) {
        const el = event.currentTarget;
        if ('link' in event.target.dataset) return;

        // Extract the data you need
        let dragData = {
            type: "Item",
            uuid: this.actor.items.find(i => i._id === event.currentTarget.dataset.itemId).uuid
        };


        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    /**
     * Define whether a user is able to begin a dragstart workflow for a given drag selector
     * @param {string} selector       The candidate HTML selector for dragging
     * @returns {boolean}             Can the current user drag this selector?
     * @protected
     */
    _canDragStart(selector) {
        // game.user fetches the current user
        return this.isEditable;
    };


    /**
     * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
     * @param {string} selector       The candidate HTML selector for the drop target
     * @returns {boolean}             Can the current user drop on this selector?
     * @protected
     */
    _canDragDrop(selector) {
        // game.user fetches the current user
        return this.isEditable;
    };



    /**
     * Callback actions which occur when a dragged element is over a drop target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    _onDragOver(event) { };

    /**
     * Callback actions which occur when a dragged element is dropped on a target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    async _onDrop(event) {
        event.preventDefault();
        if (!this.actor.testUserPermission(game.user, 'OWNER')) {
            return;
        }

        const data = TextEditor.getDragEventData(event);
        if (!(data?.type === "Item" && data?.uuid)) {
            return;
        }

        const item = await fromUuid(data.uuid);

        if (item.type === "archetype") {
            return;
        }

        await super._onDrop(event);
    }
}