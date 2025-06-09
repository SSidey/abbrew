export function bindAllChange(selector, callback, context) {
    context.element.querySelectorAll(selector).forEach(i => i.addEventListener("change", callback.bind(context)));
}