/** biome-ignore-all lint/suspicious/noPrototypeBuiltins: > */
const pick = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Partial<T> => {
    const finalObject: Partial<T> = {}
console.log({keys});
console.log({obj});





    for (const key of keys) {
        console.log("Object.prototype.hasOwnProperty.call(obj, key:", Object.prototype.hasOwnProperty.call(obj, key))
               if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        // if (obj && Object.hasOwn(obj, key)) {
            finalObject[key] = obj[key]
        }
    }
    console.log({finalObject});
    
    return finalObject
}

export default pick