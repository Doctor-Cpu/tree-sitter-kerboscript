import XCTest
import SwiftTreeSitter
import TreeSitterKerboscript

final class TreeSitterKerboscriptTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_kerboscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Kerboscript grammar")
    }
}
