import { Plugin } from 'vite';
declare type ChangeCaseType = 'camelCase' | 'capitalCase' | 'constantCase' | 'dotCase' | 'headerCase' | 'noCase' | 'paramCase' | 'pascalCase' | 'pathCase' | 'sentenceCase' | 'snakeCase';
export interface PluginOption {
    libraryName: string;
    libraryDirectory?: string;
    libraryChangeCase?: ChangeCaseType | ((name: string) => string);
    style?: (name: string) => string | null | undefined;
    styleChangeCase?: ChangeCaseType | ((name: string) => string);
    ignoreStyles?: string[];
}
export interface PluginOptions extends Array<PluginOption> {
}
export default function vitePluginBabelImport(plgOptions: PluginOptions): Plugin;
export {};
