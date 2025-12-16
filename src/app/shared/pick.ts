const pick = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Partial<T> => {
    const finalObject: Partial<T> = {}
console.log({keys});

    for (const key of keys) {
        //        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj && Object.hasOwn(obj, key)) {
            finalObject[key] = obj[key]
        }
    }
    return finalObject
}

export default pick