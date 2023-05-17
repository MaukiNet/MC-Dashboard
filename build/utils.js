"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._encode = exports.generateID = exports.getPathOfDocument = void 0;
function getPathOfDocument(public_folder_path) {
    return __dirname.replace("\\build", "\\public") + "\\" + public_folder_path;
}
exports.getPathOfDocument = getPathOfDocument;
function generateID(worker_id, process_id) {
    const increment = (Math.floor(Math.random() * (1 + 1 - 10) + 10)).toString(2);
    const worker_bin = worker_id.toString(2);
    const process_bin = process_id.toString(2);
    const timestamp_bin = Date.now().toString(2);
    return parseInt(timestamp_bin + worker_bin + process_bin + increment.toString(), 2);
}
exports.generateID = generateID;
function _encode(obj) {
    let string = "";
    for (const [key, value] of Object.entries(obj)) {
        if (!value)
            continue;
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    return string.substring(1);
}
exports._encode = _encode;
