// This is a simplified declaration file for js-yaml
declare module 'js-yaml' {
  export interface LoadOptions {
    filename?: string;
    onWarning?: (warning: any) => void;
    schema?: any;
    json?: boolean;
    listener?: (eventType: string, state: any) => void;
  }

  export interface DumpOptions {
    indent?: number;
    noArrayIndent?: boolean;
    skipInvalid?: boolean;
    flowLevel?: number;
    styles?: { [tag: string]: string };
    schema?: any;
    sortKeys?: boolean | ((a: string, b: string) => number);
    lineWidth?: number;
    noRefs?: boolean;
    noCompatMode?: boolean;
    condenseFlow?: boolean;
    quotingType?: "'" | '"';
    forceQuotes?: boolean;
    replacer?: ((key: string, value: any) => any);
  }

  export function load(input: string, options?: LoadOptions): any;
  export function loadAll(input: string, iterator?: (document: any) => void, options?: LoadOptions): any[];
  export function dump(obj: any, options?: DumpOptions): string;
  export function safeDump(obj: any, options?: DumpOptions): string;
  export function safeLoad(input: string, options?: LoadOptions): any;
  export function safeLoadAll(input: string, iterator?: (document: any) => void, options?: LoadOptions): any[];
} 