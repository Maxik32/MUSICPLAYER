export {};

declare global {
  interface HTMLMediaElement {
    /** Supported in browsers; not always present in older lib.dom typings (CI TS2339). */
    referrerPolicy?: string;
  }
}
