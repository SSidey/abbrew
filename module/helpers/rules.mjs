/**
 * Manage Rule instances through the Item Sheet via rule control buttons.
 * @param {MouseEvent} event      The left-click event on the rule control
 * @param {Item} item      The owning document which manages this rule
 */
export async function onManageRule(event, item) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    const ruleId = li.dataset.ruleId;
    let rules = foundry.utils.deepClone(item.system.rules);
    switch (a.dataset.action) {
        case "create":
            const id = uuid();
            rules = [{
                type: "rule",
                id,
                label: "New Rule",
                name: "New Rule",
                content: "CONTENT",
                icon: "icons/svg/aura.svg",
                origin: item.uuid
            },
            ...rules,];
            break;
        case "delete":
            rules = rules.filter(r => r.id != ruleId);
            break;
    }

    return await item.update({
        "system.rules": rules
    });
}

function uuid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
