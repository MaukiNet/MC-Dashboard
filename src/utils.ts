/**
 * Get the path of a document for rendering 
 * @param public_folder_path The path (without \public)
 * @returns The path of a document
 */
export function getPathOfDocument(public_folder_path: string) {
    return __dirname.replace("\\build", "\\public")+"\\"+public_folder_path;
}

/**
 * Gernate a unique ID for something
 * @param worker_id The id of the worker
 * @param process_id The id of the process
 * @returns The unquie ID
 */
export function generateID(worker_id:number, process_id:number):number {
    const increment:string = (Math.floor(Math.random() * (1+1-10) + 10)).toString(2);
    const worker_bin:string = worker_id.toString(2);
    const process_bin:string = process_id.toString(2);
    const timestamp_bin:string = Date.now().toString(2);
    return parseInt(timestamp_bin+worker_bin+process_bin+increment.toString(), 2);
}

/**
 * URLEncode a JSON-Object 
 * @param obj The object 
 * @returns The URLEncoded object
 */
export function _encode(obj:object) {
    let string = "";
    for (const [key, value] of Object.entries(obj)) {
        if (!value) continue;
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    return string.substring(1);
}