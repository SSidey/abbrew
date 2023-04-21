export function writeToPath(element, path, value) {    
    let pathWrite = [];
    pathWrite[path] = value;
    let keyed = expandObject(pathWrite);
    element.update(keyed);
}