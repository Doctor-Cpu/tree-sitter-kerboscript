/**
 * @file kerboscript grammar for tree-sitter
 * @author Doctor-Cpu
 * @license GPLv3
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// KOS lowercases all input before lexing which is why keywords are
// matched case-insensitive and since the Tree-sitter regex expander
// rejects the case flag and word boundaries each keyword letter is
// written as a character class pair
const casepairs = (word) =>
  word.replace(/[a-z]/g, (c) => '[' + c + c.toUpperCase() + ']')

// reserved words as distinct named tokens so the query can style each
// one while the per word symbols keep the exact parser states the old
// anonymous kw tokens gave which is why this stays conflict free
const RESERVED = [
  'set', 'to', 'if', 'else', 'until', 'for', 'in', 'from', 'step', 'do',
  'unlock', 'all', 'print', 'at', 'on', 'toggle', 'wait', 'when', 'then',
  'stage', 'clearscreen', 'add', 'remove', 'log', 'break', 'preserve',
  'declare', 'local', 'global', 'parameter', 'is', 'function', 'lock',
  'return', 'switch', 'copy', 'rename', 'volume', 'file', 'delete',
  'edit', 'run', 'once', 'runpath', 'runoncepath', 'compile', 'list',
  'reboot', 'shutdown', 'unset', 'lazyglobal', 'off', 'clobberbuiltins',
  'choose', 'not', 'defined', 'or', 'and',
]

// builtin functions as named tokens so calls highlight as builtins
// they only ever occupy a value slot so they join the atom choice
const BUILTINS = [
  'assert', 'background', 'char', 'clock', 'date', 'display',
  'foreground', 'input', 'mod', 'prompt', 'random', 'range', 'round',
  'screen', 'time', 'version',
]

const namedTokens = {}
for (const word of [...RESERVED, ...BUILTINS]) {
  namedTokens[word] = () =>
    token(new RegExp(casepairs(word)))
}

export default grammar({
  name: 'kerboscript',

  extras: $ => [/\s+/, $.comment],

  conflicts: $ => [
    // an open paren after a statement can be a call trailer on its last atom or the start of the next statement
    [$._statement, $._atom],
    // an open paren after an if condition can call the condition or open the then body
    [$.suffixterm],
    // a dot after a composite body can end that body or stand alone as an empty statement
    [$._instruction_terminator],
    // the optional dot on a function body collides with a following empty statement
    [$.function_clause],
  ],

  rules: {
    // the object's first rule becomes the start symbol so program stays first
    program: $ => repeat($._statement),

    // reserved words and builtins are named terminal tokens defined
    // before identifier so they win the equal length lexer tie against it
    // keeping the per word parser states
    ...namedTokens,

    _statement: $ => choice(
      $.empty_statement,
      $.set_statement,
      $.if_statement,
      $.until_statement,
      $.for_statement,
      $.fromloop_statement,
      $.unlock_statement,
      $.print_statement,
      $.on_statement,
      $.toggle_statement,
      $.wait_statement,
      $.when_statement,
      $.stage_statement,
      $.clearscreen_statement,
      $.add_statement,
      $.remove_statement,
      $.log_statement,
      $.break_statement,
      $.preserve_statement,
      $.declaration,
      $.return_statement,
      $.switch_statement,
      $.copy_statement,
      $.rename_statement,
      $.delete_statement,
      $.edit_statement,
      $.run_statement,
      $.runpath_statement,
      $.runoncepath_statement,
      $.compile_statement,
      $.list_statement,
      $.reboot_statement,
      $.shutdown_statement,
      $.unset_statement,
      $.instruction_block,
      $.call_statement,
      $.directive,
    ),

    // KOS makes the trailing dot optional on sub statements nested inside composite statements
    _instruction_terminator: $ => seq($._statement, optional($.terminator)),

    // simple statements
    empty_statement: $ => $.terminator,

    set_statement: $ => seq(
      $.set,
      field('target', $._varidentifier),
      $.to,
      field('value', $._expression),
      repeat(
        seq(
          ',',
          field('target', $._varidentifier),
          $.to,
          field('value', $._expression),
        ),
      ),
      $.terminator,
    ),

    // the else production outranks the plain one so a dangling else binds to the inner if the same way KOS does
    if_statement: $ => choice(
      prec(1, seq(
        $.if,
        field('condition', $._expression),
        field('then', $._instruction_terminator),
        $.else,
        field('else', $._instruction_terminator),
      )),
      seq(
        $.if,
        field('condition', $._expression),
        field('then', $._instruction_terminator),
      ),
    ),

    until_statement: $ => seq(
      $.until,
      field('condition', $._expression),
      field('body', $._instruction_terminator),
    ),

    for_statement: $ => seq(
      $.for,
      field('variable', $.identifier),
      $.in,
      field('list', $._varidentifier),
      field('body', $._instruction_terminator),
    ),

    fromloop_statement: $ => seq(
      $.from,
      field('init', $.instruction_block),
      $.until,
      field('condition', $._expression),
      $.step,
      field('step', $.instruction_block),
      $.do,
      field('body', $._instruction_terminator),
    ),
    unlock_statement: $ =>
      seq($.unlock, field('target', choice($.identifier, $.all)), $.terminator),

    print_statement: $ => seq(
      $.print,
      field('value', $._expression),
      optional(seq($.at, '(', $._expression, ',', $._expression, ')')),
      $.terminator,
    ),

    on_statement: $ => seq(
      $.on,
      field('trigger', $._varidentifier),
      field('action', $._instruction_terminator),
    ),

    toggle_statement: $ =>
      seq($.toggle, field('target', $._varidentifier), $.terminator),

    wait_statement: $ =>
      seq($.wait, optional($.until), field('duration', $._expression), $.terminator),

    when_statement: $ => seq(
      $.when,
      field('condition', $._expression),
      $.then,
      field('body', $._instruction_terminator),
    ),

    stage_statement: $ => seq($.stage, $.terminator),

    clearscreen_statement: $ => seq($.clearscreen, $.terminator),

    add_statement: $ => seq($.add, field('value', $._expression), $.terminator),

    remove_statement: $ => seq($.remove, field('value', $._expression), $.terminator),

    log_statement: $ => seq(
      $.log,
      field('message', $._expression),
      $.to,
      field('file', $._expression),
      $.terminator,
    ),

    break_statement: $ => seq($.break, $.terminator),

    preserve_statement: $ => seq($.preserve, $.terminator),

    declaration: $ => choice(
      // KOS lets parameter function and lock clauses stand bare but identifier declarations always carry the scope prefix
      $.parameter_clause,
      $.function_clause,
      $.lock_clause,
      seq(
        field(
          'scope',
          choice(
            $.declare,
            $.local,
            $.global,
            seq($.declare, choice($.local, $.global)),
          ),
        ),
        choice(
          $.parameter_clause,
          $.function_clause,
          $.lock_clause,
          $.identifier_clause,
        ),
      ),
    ),

    identifier_clause: $ => seq(
      field('name', $.identifier),
      choice($.to, $.is),
      field('value', $._expression),
      repeat(
        seq(
          ',',
          field('name', $.identifier),
          choice($.to, $.is),
          field('value', $._expression),
        ),
      ),
      $.terminator,
    ),

    parameter_clause: $ => seq(
      $.parameter,
      field('name', $.identifier),
      optional(seq(choice($.to, $.is), field('default', $._expression))),
      repeat(
        seq(
          ',',
          field('name', $.identifier),
          optional(seq(choice($.to, $.is), field('default', $._expression))),
        ),
      ),
      $.terminator,
    ),

    // the closing brace already ends the declaration so the trailing dot is optional
    function_clause: $ => seq(
      $.function,
      field('name', $.identifier),
      field('body', $.instruction_block),
      optional($.terminator),
    ),

    lock_clause: $ => seq(
      $.lock,
      field('target', $.identifier),
      $.to,
      field('value', $._expression),
      $.terminator,
    ),

    return_statement: $ =>
      seq($.return, optional(field('value', $._expression)), $.terminator),

    switch_statement: $ =>
      seq($.switch, $.to, field('target', $._expression), $.terminator),

    copy_statement: $ =>
      seq(
        $.copy,
        field('source', $._expression),
        choice($.from, $.to),
        field('destination', $._expression),
        $.terminator,
      ),

    rename_statement: $ => seq(
      $.rename,
      optional(choice($.volume, $.file)),
      field('old', $._expression),
      $.to,
      field('new', $._expression),
      $.terminator,
    ),

    delete_statement: $ =>
      seq(
        $.delete,
        field('target', $._expression),
        optional(seq($.from, field('container', $._expression))),
        $.terminator,
      ),

    edit_statement: $ => seq($.edit, field('target', $._expression), $.terminator),

    run_statement: $ => seq(
      $.run,
      optional($.once),
      field('target', choice($.file_identifier, $.string)),
      optional(seq('(', $.arglist, ')')),
      optional(seq($.on, $._expression)),
      $.terminator,
    ),

    runpath_statement: $ =>
      seq(
        $.runpath,
        '(',
        field('path', $._expression),
        optional(seq(',', $.arglist)),
        ')',
        $.terminator,
      ),

    runoncepath_statement: $ =>
      seq(
        $.runoncepath,
        '(',
        field('path', $._expression),
        optional(seq(',', $.arglist)),
        ')',
        $.terminator,
      ),

    compile_statement: $ =>
      seq(
        $.compile,
        field('source', $._expression),
        optional(seq($.to, field('target', $._expression))),
        $.terminator,
      ),

    list_statement: $ =>
      seq(
        $.list,
        optional(
          seq(
            field('source', $.identifier),
            optional(seq($.in, field('target', $.identifier))),
          ),
        ),
        $.terminator,
      ),

    reboot_statement: $ => seq($.reboot, $.terminator),

    shutdown_statement: $ => seq($.shutdown, $.terminator),

    unset_statement: $ =>
      seq($.unset, field('target', choice($.identifier, $.all)), $.terminator),

    // blocks calls and directives
    instruction_block: $ => seq('{', repeat($._statement), '}'),

    // KOS lets any suffix chain with an optional on or off trailer stand alone as a statement
    call_statement: $ =>
      seq(
        field('target', $.suffix_expression),
        optional(choice($.on, $.off)),
        $.terminator,
      ),

    // KOS lets directives appear anywhere so parsing is permissive and the compiler rejects misplaced ones
    directive: $ => seq('@', choice($.lazyglobal_directive, $.clobberbuiltins_directive)),

    lazyglobal_directive: $ =>
      seq($.lazyglobal, choice($.on, $.off), $.terminator),

    clobberbuiltins_directive: $ =>
      seq($.clobberbuiltins, choice($.on, $.off), $.terminator),

    // expressions
    // precedence loosest to tightest matching kRISC.tpg
    // choose if else < or < and < comparisons < + - < * /
    // unary + - not defined < ** < suffix chain call # [] :
    // A block used as a value only enters here through the _atom
    // production so the parser keeps one path per block value
    _expression: $ => choice($.ternary_expression, $.or_expression),

    ternary_expression: $ =>
      prec(
        1,
        seq(
          $.choose,
          field('value', $._expression),
          $.if,
          field('condition', $._expression),
          $.else,
          field('else', $._expression),
        ),
      ),

    or_expression: $ =>
      prec.left(2, seq($.and_expression, repeat(seq($.or, $.and_expression)))),

    and_expression: $ =>
      prec.left(3, seq($.comparison_expression, repeat(seq($.and, $.comparison_expression)))),

    comparison_expression: $ =>
      prec.left(
        4,
        seq(
          $.addition_expression,
          repeat(
            seq(
              choice('=', '<>', '<=', '>=', '<', '>'),
              $.addition_expression,
            ),
          ),
        ),
      ),

    addition_expression: $ =>
      prec.left(
        5,
        seq($.multiplication_expression, repeat(seq(choice('+', '-'), $.multiplication_expression))),
      ),

    multiplication_expression: $ =>
      prec.left(
        6,
        seq($.unary_expression, repeat(seq(choice('*', '/'), $.unary_expression))),
      ),

    // only one prefix operator because KOS does not stack them
    unary_expression: $ =>
      prec(
        7,
        seq(
          optional(field('operator', choice('+', '-', $.not, $.defined))),
          field('operand', $.power_expression),
        ),
      ),

    power_expression: $ =>
      prec.left(8, seq($.suffix_expression, repeat(seq('^', $.suffix_expression)))),

    suffix_expression: $ =>
      prec(9, seq($.suffixterm, repeat(seq(':', field('suffix', $.suffixterm))))),

    suffixterm: $ =>
      prec(
        10,
        seq(
          field('atom', $._atom),
          repeat(
            field('trailer', choice($._call_trailer, $._at_trailer, $._array_trailer)),
          ),
        ),
      ),

    _call_trailer: $ => seq('(', optional($.arglist), ')'),

    _at_trailer: $ => '@',

    _array_trailer: $ => choice($._hash_index, $._bracket_index),

    _hash_index: $ => seq('#', choice($.identifier, $.number)),

    _bracket_index: $ => seq('[', $._expression, ']'),

    // KOS lexes a spaced exponent as separate tokens so 12.3 e 5 must parse while the glued 12.3e5 stays one number token
    sci_number: $ =>
      seq(
        field('mantissa', $.number),
        field('exponent', $.exponent),
        optional(field('sign', choice('+', '-'))),
        field('power', $.integer),
      ),

    _atom: $ => choice(
      field('value', $.sci_number),
      field('value', $.number),
      field('value', $.boolean),
      field('value', $.string),
      field('value', $.identifier),
      field('value', $.file_identifier),
      ...BUILTINS.map((word) => field('value', $[word])),
      seq('(', $._expression, ')'),
      $.instruction_block,
    ),

    // the lhs of set is the full suffix chain because KOS parses targets permissively and the compiler rejects bad ones
    _varidentifier: $ => $.suffix_expression,

    arglist: $ => seq($._expression, repeat(seq(',', $._expression))),

    // terminals
    comment: $ => token(seq('//', /[^\n]*/)),

    // integers doubles and glued exponents share one token because longest match picks the widest reading anyway
    number: $ => token(
      seq(
        choice(
          /\d[\d_]*/,
          seq(optional(/\d[\d_]*/), /\./, /\d[\d_]*/),
        ),
        optional(seq(/[eE]/, optional(/[+-]/), /\d[\d_]*/)),
      ),
    ),

    // the power part of a spaced exponent which can only follow an exponent token so it never competes with number
    integer: $ => token(/\d[\d_]*/),

    // the exponent marker which only reads as an exponent right after a number so a variable named e stays an identifier elsewhere
    exponent: $ => token(/[eE]/),

    // no word boundary because the expander rejects assertions so pure longest match keeps trueX an identifier and bare true a boolean
    boolean: $ => token(/(?:[tT][rR][uU][eE]|[fF][aA][lL][sS][eE])/),

    string: $ => token(seq(optional('@'), /"/, /(?:""|[^"])*?/, /"/)),

    // first and continuation chars are both Unicode word chars because
    // KOS uses the .NET \w class which is Unicode aware so accented and
    // Cyrillic names compile
    // a bare name beats file_identifier on the equal-length tie which
    // is why no token precedence exists anywhere
    identifier: $ => token(/[_\p{L}][\p{L}\p{N}_]*/),

    // KOS FILEIDENT a path qualified identifier like kx.file
    file_identifier: $ =>
      token(
        /[_\p{L}][\p{L}\p{N}_]*(?:\.[_\p{L}][\p{L}\p{N}_]*)*/,
      ),

    terminator: $ => '.',
  },
})
