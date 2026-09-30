;; comments
(comment) @comment

;; literals
(string) @string
(sci_number) @number
(number) @number
(boolean) @boolean

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
