"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parser = __importStar(require("@babel/parser"));
const types = __importStar(require("@babel/types"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
const helper_module_imports_1 = require("@babel/helper-module-imports");
const changeCase = __importStar(require("change-case"));
const pkg = __importStar(require("../package.json"));
function vitePluginBabelImport(plgOptions) {
    let viteConfig;
    return {
        name: pkg.name,
        configResolved(resolvedConfig) {
            viteConfig = resolvedConfig;
        },
        transform(code, id) {
            if (!/\.(?:[jt]sx?|vue)$/.test(id))
                return;
            return {
                code: transformSrcCode(code, transformOptions(plgOptions), viteConfig),
                map: null,
            };
        },
    };
}
exports.default = vitePluginBabelImport;
function transformOptions(options) {
    return options.map((opt) => {
        let libraryCaseFn;
        let styleCaseFn;
        if (typeof opt.libraryChangeCase === 'function') {
            libraryCaseFn = opt.libraryChangeCase;
        }
        else {
            libraryCaseFn = (name) => {
                return changeCase[(opt.libraryChangeCase || 'paramCase')](name);
            };
        }
        if (typeof opt.styleChangeCase === 'function') {
            styleCaseFn = opt.styleChangeCase;
        }
        else {
            styleCaseFn = (name) => {
                return changeCase[(opt.styleChangeCase || 'paramCase')](name);
            };
        }
        return {
            libraryName: opt.libraryName,
            libraryResolve: (name) => {
                let libraryPaths = [opt.libraryName];
                if (opt.libraryDirectory) {
                    libraryPaths.push(opt.libraryDirectory);
                }
                libraryPaths.push(libraryCaseFn(name));
                return libraryPaths.join('/').replace(/\/\//g, '/');
            },
            styleResolve: opt.style
                ? (name) => {
                    var _a;
                    if ((_a = opt.ignoreStyles) === null || _a === void 0 ? void 0 : _a.includes(name))
                        return null;
                    return opt.style(styleCaseFn(name));
                }
                : null,
        };
    });
}
function transformSrcCode(code, plgOptions, viteConfig) {
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });
    (0, traverse_1.default)(ast, {
        enter(path) {
            const { node } = path;
            if (types.isImportDeclaration(node)) {
                const { value } = node.source;
                const plgOpt = plgOptions.find((opt) => opt.libraryName === value);
                if (plgOpt) {
                    let importStyles = [];
                    let declarations = [];
                    node.specifiers.forEach((spec) => {
                        if (types.isImportSpecifier(spec)) {
                            let importedName = spec.imported.name;
                            let libPath = plgOpt.libraryResolve(importedName);
                            declarations.push(types.importDeclaration([
                                types.importDefaultSpecifier(types.identifier(spec.local.name)),
                            ], types.stringLiteral(libPath)));
                            if (plgOpt.styleResolve) {
                                let styleImpPath = plgOpt.styleResolve(importedName);
                                if (styleImpPath) {
                                    importStyles.push(styleImpPath);
                                }
                            }
                        }
                    });
                    path.replaceWithMultiple(declarations);
                    importStyles.forEach((style) => {
                        (0, helper_module_imports_1.addSideEffect)(path, style);
                    });
                }
            }
        },
    });
    return (0, generator_1.default)(ast).code;
}
