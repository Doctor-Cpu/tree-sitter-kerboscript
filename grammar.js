/**
 * @file kerboscript grammar for tree-sitter
 * @author Doctor-Cpu
 * @license GPLv3
 *
 * ported from the KOS project tpg grammar and scanner at
 * kOS.Safe/Compilation/KS so the grammar accepts the same scripts the
 * official parser accepts
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// KOS lowercases all input before lexing which is why keywords are
// matched case-insensitive and since the Tree-sitter regex expander
// rejects the case flag and word boundaries each keyword letter is
// written as a character class pair
const kw = (word) =>
  token(
    new RegExp(word.replace(/[a-z]/g, (c) => '[' + c + c.toUpperCase() + ']')),
  )

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
    // top level
    program: $ => repeat($._statement),

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
      kw('set'),
      field('target', $._varidentifier),
      kw('to'),
      field('value', $._expression),
      repeat(
        seq(
          ',',
          field('target', $._varidentifier),
          kw('to'),
          field('value', $._expression),
        ),
      ),
      $.terminator,
    ),

    // the else production outranks the plain one so a dangling else binds to the inner if the same way KOS does
    if_statement: $ => choice(
      prec(1, seq(
        kw('if'),
        field('condition', $._expression),
        field('then', $._instruction_terminator),
        kw('else'),
        field('else', $._instruction_terminator),
      )),
      seq(
        kw('if'),
        field('condition', $._expression),
        field('then', $._instruction_terminator),
      ),
    ),

    until_statement: $ => seq(
      kw('until'),
      field('condition', $._expression),
      field('body', $._instruction_terminator),
    ),

    for_statement: $ => seq(
      kw('for'),
      field('variable', $.identifier),
      kw('in'),
      field('list', $._varidentifier),
      field('body', $._instruction_terminator),
    ),

    fromloop_statement: $ => seq(
      kw('from'),
      field('init', $.instruction_block),
      kw('until'),
      field('condition', $._expression),
      kw('step'),
      field('step', $.instruction_block),
      kw('do'),
      field('body', $._instruction_terminator),
    ),
    unlock_statement: $ =>
      seq(kw('unlock'), field('target', choice($.identifier, kw('all'))), $.terminator),

    print_statement: $ => seq(
      kw('print'),
      field('value', $._expression),
      optional(seq(kw('at'), '(', $._expression, ',', $._expression, ')')),
      $.terminator,
    ),

    on_statement: $ => seq(
      kw('on'),
      field('trigger', $._varidentifier),
      field('action', $._instruction_terminator),
    ),

    toggle_statement: $ =>
      seq(kw('toggle'), field('target', $._varidentifier), $.terminator),

    wait_statement: $ =>
      seq(kw('wait'), optional(kw('until')), field('duration', $._expression), $.terminator),

    when_statement: $ => seq(
      kw('when'),
      field('condition', $._expression),
      kw('then'),
      field('body', $._instruction_terminator),
    ),

    stage_statement: $ => seq(kw('stage'), $.terminator),

    clearscreen_statement: $ => seq(kw('clearscreen'), $.terminator),

    add_statement: $ => seq(kw('add'), field('value', $._expression), $.terminator),

    remove_statement: $ => seq(kw('remove'), field('value', $._expression), $.terminator),

    log_statement: $ => seq(
      kw('log'),
      field('message', $._expression),
      kw('to'),
      field('file', $._expression),
      $.terminator,
    ),

    break_statement: $ => seq(kw('break'), $.terminator),

    preserve_statement: $ => seq(kw('preserve'), $.terminator),

    declaration: $ => choice(
      // KOS lets parameter function and lock clauses stand bare but identifier declarations always carry the scope prefix
      $.parameter_clause,
      $.function_clause,
      $.lock_clause,
      seq(
        field(
          'scope',
          choice(
            kw('declare'),
            kw('local'),
            kw('global'),
            seq(kw('declare'), choice(kw('local'), kw('global'))),
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
      choice(kw('to'), kw('is')),
      field('value', $._expression),
      repeat(
        seq(
          ',',
          field('name', $.identifier),
          choice(kw('to'), kw('is')),
          field('value', $._expression),
        ),
      ),
      $.terminator,
    ),

    parameter_clause: $ => seq(
      kw('parameter'),
      field('name', $.identifier),
      optional(seq(choice(kw('to'), kw('is')), field('default', $._expression))),
      repeat(
        seq(
          ',',
          field('name', $.identifier),
          optional(seq(choice(kw('to'), kw('is')), field('default', $._expression))),
        ),
      ),
      $.terminator,
    ),

    // the closing brace already ends the declaration so the trailing dot is optional
    function_clause: $ => seq(
      kw('function'),
      field('name', $.identifier),
      field('body', $.instruction_block),
      optional($.terminator),
    ),

    lock_clause: $ => seq(
      kw('lock'),
      field('target', $.identifier),
      kw('to'),
      field('value', $._expression),
      $.terminator,
    ),

    return_statement: $ =>
      seq(kw('return'), optional(field('value', $._expression)), $.terminator),

    switch_statement: $ =>
      seq(kw('switch'), kw('to'), field('target', $._expression), $.terminator),

    copy_statement: $ =>
      seq(
        kw('copy'),
        field('source', $._expression),
        choice(kw('from'), kw('to')),
        field('destination', $._expression),
        $.terminator,
      ),

    rename_statement: $ => seq(
      kw('rename'),
      optional(choice(kw('volume'), kw('file'))),
      field('old', $._expression),
      kw('to'),
      field('new', $._expression),
      $.terminator,
    ),

    delete_statement: $ =>
      seq(
        kw('delete'),
        field('target', $._expression),
        optional(seq(kw('from'), field('container', $._expression))),
        $.terminator,
      ),

    edit_statement: $ => seq(kw('edit'), field('target', $._expression), $.terminator),

    run_statement: $ => seq(
      kw('run'),
      optional(kw('once')),
      field('target', choice($.file_identifier, $.string)),
      optional(seq('(', $.arglist, ')')),
      optional(seq(kw('on'), $._expression)),
      $.terminator,
    ),

    runpath_statement: $ =>
      seq(
        kw('runpath'),
        '(',
        field('path', $._expression),
        optional(seq(',', $.arglist)),
        ')',
        $.terminator,
      ),

    runoncepath_statement: $ =>
      seq(
        kw('runoncepath'),
        '(',
        field('path', $._expression),
        optional(seq(',', $.arglist)),
        ')',
        $.terminator,
      ),

    compile_statement: $ =>
      seq(
        kw('compile'),
        field('source', $._expression),
        optional(seq(kw('to'), field('target', $._expression))),
        $.terminator,
      ),

    list_statement: $ =>
      seq(
        kw('list'),
        optional(
          seq(
            field('source', $.identifier),
            optional(seq(kw('in'), field('target', $.identifier))),
          ),
        ),
        $.terminator,
      ),

    reboot_statement: $ => seq(kw('reboot'), $.terminator),

    shutdown_statement: $ => seq(kw('shutdown'), $.terminator),

    unset_statement: $ =>
      seq(kw('unset'), field('target', choice($.identifier, kw('all'))), $.terminator),

    // blocks calls and directives
    instruction_block: $ => seq('{', repeat($._statement), '}'),

    // KOS lets any suffix chain with an optional on or off trailer stand alone as a statement
    call_statement: $ =>
      seq(
        field('target', $.suffix_expression),
        optional(choice(kw('on'), kw('off'))),
        $.terminator,
      ),

    // KOS lets directives appear anywhere so parsing is permissive and the compiler rejects misplaced ones
    directive: $ => seq('@', choice($.lazyglobal_directive, $.clobberbuiltins_directive)),

    lazyglobal_directive: $ =>
      seq(kw('lazyglobal'), choice(kw('on'), kw('off')), $.terminator),

    clobberbuiltins_directive: $ =>
      seq(kw('clobberbuiltins'), choice(kw('on'), kw('off')), $.terminator),

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
          kw('choose'),
          field('value', $._expression),
          kw('if'),
          field('condition', $._expression),
          kw('else'),
          field('else', $._expression),
        ),
      ),

    or_expression: $ =>
      prec.left(2, seq($.and_expression, repeat(seq(kw('or'), $.and_expression)))),

    and_expression: $ =>
      prec.left(3, seq($.comparison_expression, repeat(seq(kw('and'), $.comparison_expression)))),

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
          optional(field('operator', choice('+', '-', kw('not'), kw('defined')))),
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
