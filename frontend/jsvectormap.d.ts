declare module 'jsvectormap' {
    interface VectorMapOptions {
        [key: string]: unknown;
    }
    
    interface VectorMapInstance {
        [key: string]: unknown;
    }
    
    interface VectorMapConstructor {
        new (options: VectorMapOptions): VectorMapInstance;
        [key: string]: unknown;
    }
    
    const jsVectorMap: VectorMapConstructor;
    export default jsVectorMap;
}
