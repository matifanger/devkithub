// Extends the window object with the cryptoAPI object
interface Window {
    cryptoAPI: {
        hash: (algorithm: string, data: string) => Promise<string>;
        generateRandomBytes: (size: number) => string;
    }
}