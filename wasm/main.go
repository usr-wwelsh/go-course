// Command wasm compiles to GOOS=js GOARCH=wasm and runs a yaegi interpreter
// in the browser to check student exercise submissions against test cases.
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// TestCase is one exercise check: call FuncName(ArgsGo) and expect ExpectedGo.
// ArgsGo and ExpectedGo are verbatim Go source snippets, not JSON values.
type TestCase struct {
	Name       string `json:"name"`
	ArgsGo     string `json:"argsGo"`
	ExpectedGo string `json:"expectedGo"`
	Hidden     bool   `json:"hidden"`
}

// Result is the outcome of running one TestCase against student code.
type Result struct {
	Name   string `json:"name"`
	Passed bool   `json:"passed"`
	Got    string `json:"got,omitempty"`
	Want   string `json:"want,omitempty"`
	Hidden bool   `json:"hidden"`
}

const resultSep = "\x1f"

// GenerateHarness appends a func main to studentCode that calls funcName for
// every case and prints a machine-parsable RESULT line per case. studentCode
// must be a complete `package main` file (imports + the function under test)
// with no func main of its own, and must import "fmt" — the generated main
// always uses it to compare results, regardless of what the student's own
// code needs.
func GenerateHarness(studentCode, funcName string, cases []TestCase) string {
	var b strings.Builder
	b.WriteString(studentCode)
	b.WriteString("\n\nfunc main() {\n")
	for _, c := range cases {
		passMsg := strconv.Quote(strings.Join([]string{"RESULT", "PASS", c.Name}, resultSep) + "\n")
		failFmt := strconv.Quote(strings.Join([]string{"RESULT", "FAIL", c.Name, "%s", "%s"}, resultSep) + "\n")
		fmt.Fprintf(&b, "\tif got, want := fmt.Sprintf(\"%%v\", %s(%s)), fmt.Sprintf(\"%%v\", %s); got == want {\n",
			funcName, c.ArgsGo, c.ExpectedGo)
		fmt.Fprintf(&b, "\t\tfmt.Print(%s)\n", passMsg)
		b.WriteString("\t} else {\n")
		fmt.Fprintf(&b, "\t\tfmt.Printf(%s, got, want)\n", failFmt)
		b.WriteString("\t}\n")
	}
	b.WriteString("}\n")
	return b.String()
}

// ParseResults reads the RESULT lines printed by a harness built with
// GenerateHarness and reports one Result per case, in case order. A case
// with no matching RESULT line (e.g. the program panicked before reaching
// it) is reported as not passed.
func ParseResults(output string, cases []TestCase) []Result {
	found := make(map[string]Result, len(cases))
	for _, line := range strings.Split(output, "\n") {
		fields := strings.Split(line, resultSep)
		if len(fields) < 3 || fields[0] != "RESULT" {
			continue
		}
		name := fields[2]
		switch fields[1] {
		case "PASS":
			found[name] = Result{Name: name, Passed: true}
		case "FAIL":
			if len(fields) < 5 {
				continue
			}
			found[name] = Result{Name: name, Passed: false, Got: fields[3], Want: fields[4]}
		}
	}

	results := make([]Result, len(cases))
	for i, c := range cases {
		r, ok := found[c.Name]
		if !ok {
			r = Result{Name: c.Name}
		}
		r.Hidden = c.Hidden
		results[i] = r
	}
	return results
}
