package main

import (
	"strings"
	"testing"
)

func TestGenerateHarness_CallsFunctionUnderTestWithGivenArgs(t *testing.T) {
	src := GenerateHarness(
		"package main\n\nimport \"fmt\"\n\nfunc Sum(a, b int) int { return a + b }\n",
		"Sum",
		[]TestCase{{Name: "basic", ArgsGo: "2, 3", ExpectedGo: "5"}},
	)

	if !containsAll(src, "Sum(2, 3)", "func main()") {
		t.Fatalf("harness missing call to function under test:\n%s", src)
	}
}

func TestGenerateHarness_PreservesStudentCodeVerbatim(t *testing.T) {
	student := "package main\n\nimport \"fmt\"\n\nfunc Double(x int) int { return x * 2 }\n"
	src := GenerateHarness(student, "Double", nil)

	if !containsAll(src, student) {
		t.Fatalf("harness dropped or mangled student code:\n%s", src)
	}
}

func TestParseResults_ReportsPassWhenResultLineSaysPass(t *testing.T) {
	cases := []TestCase{{Name: "basic", Hidden: false}}
	output := "RESULT\x1fPASS\x1fbasic\n"

	results := ParseResults(output, cases)

	if len(results) != 1 || !results[0].Passed {
		t.Fatalf("expected a single passing result, got %+v", results)
	}
}

func TestParseResults_ReportsFailureWithGotAndWant(t *testing.T) {
	cases := []TestCase{{Name: "basic", Hidden: false}}
	output := "RESULT\x1fFAIL\x1fbasic\x1f4\x1f5\n"

	results := ParseResults(output, cases)

	want := Result{Name: "basic", Passed: false, Got: "4", Want: "5", Hidden: false}
	if len(results) != 1 || results[0] != want {
		t.Fatalf("got %+v, want %+v", results, want)
	}
}

func TestParseResults_CarriesHiddenFlagFromTestCase(t *testing.T) {
	cases := []TestCase{{Name: "secret", Hidden: true}}
	output := "RESULT\x1fPASS\x1fsecret\n"

	results := ParseResults(output, cases)

	if len(results) != 1 || !results[0].Hidden {
		t.Fatalf("expected hidden flag to carry through, got %+v", results)
	}
}

func TestParseResults_IgnoresUnrelatedStdoutLines(t *testing.T) {
	cases := []TestCase{{Name: "basic", Hidden: false}}
	output := "debug: entering loop\nRESULT\x1fPASS\x1fbasic\nsome other println\n"

	results := ParseResults(output, cases)

	if len(results) != 1 {
		t.Fatalf("expected non-RESULT lines to be ignored, got %+v", results)
	}
}

func TestParseResults_MarksMissingTestAsNotRunWhenNoResultLineEmitted(t *testing.T) {
	cases := []TestCase{{Name: "basic", Hidden: false}, {Name: "never_ran", Hidden: false}}
	output := "RESULT\x1fPASS\x1fbasic\n"

	results := ParseResults(output, cases)

	if len(results) != 2 {
		t.Fatalf("expected a result entry for every test case, got %+v", results)
	}
	if results[1].Name != "never_ran" || results[1].Passed {
		t.Fatalf("expected never_ran to be reported as not passed, got %+v", results[1])
	}
}

func containsAll(s string, subs ...string) bool {
	for _, sub := range subs {
		if !strings.Contains(s, sub) {
			return false
		}
	}
	return true
}
