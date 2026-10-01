;; comments
(comment) @comment

;; literals
(string) @string
(sci_number) @number
(number) @number
(boolean) @boolean

;; keywords - each reserved word is its own named token so every one
;; gets a distinct capture instead of one shared keyword rule
(set) @keyword
(to) @keyword
(if) @keyword
(else) @keyword
(until) @keyword
(for) @keyword
(in) @keyword
(from) @keyword
(step) @keyword
(do) @keyword
(unlock) @keyword
(all) @keyword
(print) @keyword
(at) @keyword
(on) @keyword
(toggle) @keyword
(wait) @keyword
(when) @keyword
(then) @keyword
(stage) @keyword
(clearscreen) @keyword
(add) @keyword
(remove) @keyword
(log) @keyword
(break) @keyword
(preserve) @keyword
(declare) @keyword
(local) @keyword
(global) @keyword
(parameter) @keyword
(is) @keyword
(function) @keyword
(lock) @keyword
(return) @keyword
(switch) @keyword
(copy) @keyword
(rename) @keyword
(volume) @keyword
(file) @keyword
(delete) @keyword
(edit) @keyword
(run) @keyword
(once) @keyword
(runpath) @keyword
(runoncepath) @keyword
(compile) @keyword
(list) @keyword
(reboot) @keyword
(shutdown) @keyword
(unset) @keyword
(lazyglobal) @keyword
(off) @keyword
(clobberbuiltins) @keyword
(choose) @keyword
(not) @keyword
(defined) @keyword
(or) @keyword
(and) @keyword

;; builtin functions - named tokens that only appear in value position
(assert) @function.builtin
(background) @function.builtin
(char) @function.builtin
(clock) @function.builtin
(date) @function.builtin
(display) @function.builtin
(foreground) @function.builtin
(input) @function.builtin
(mod) @function.builtin
(prompt) @function.builtin
(random) @function.builtin
(range) @function.builtin
(round) @function.builtin
(screen) @function.builtin
(time) @function.builtin
(version) @function.builtin

;; identifiers - the specific rules come first so the bare one does not
;; shadow them
(function_clause name: (identifier) @function)
(parameter_clause name: (identifier) @parameter)
(identifier) @variable

;; operators
("=" @operator)
("<>" @operator)
("<" @operator)
("<=" @operator)
(">" @operator)
(">=" @operator)
("+" @operator)
("-" @operator)
("*" @operator)
("/" @operator)
("^" @operator)
("@" @operator)
("#" @operator)

;; punctuation
(terminator) @punctuation.terminator
("(" @punctuation.bracket)
(")" @punctuation.bracket)
("[" @punctuation.bracket)
("]" @punctuation.bracket)
("{" @punctuation.bracket)
("}" @punctuation.bracket)
