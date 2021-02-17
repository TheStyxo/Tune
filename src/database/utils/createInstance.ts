export default function createInstance<T>(data: T): T {
    return Object.assign(new class DataCacheInstance { constructor() { } }(), data);
}