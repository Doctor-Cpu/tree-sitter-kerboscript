package tree_sitter_kerboscript_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_kerboscript "github.com/doctor-cpu/tree-sitter-kerboscript/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_kerboscript.Language())
	if language == nil {
		t.Errorf("Error loading Kerboscript grammar")
	}
}
