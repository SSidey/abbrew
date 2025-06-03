export default class AbbrewTokenDocument extends TokenDocument {
    _preUpdate(changed, options, user) {
        console.log("Token Update");
        console.log(JSON.stringify(changed));
    }
}