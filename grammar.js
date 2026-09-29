/**
 * @file Kerboscript grammar for tree-sitter
 * @author Doctor-Cpu
 * @license GPLv3
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "kerboscript",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
