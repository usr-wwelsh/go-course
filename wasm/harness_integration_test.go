//go:build integration

// These tests run the generated harness through yaegi's real Eval path
// (the same interpreter that will run in the WASM build), instead of the
// native go toolchain, so they also verify EvalWithContext's timeout
// behavior against a genuinely runaway program.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

// manifest is content/<slug>/tests.json: which function each exercise checks
// and the test cases to run against it.
type manifest struct {
	FuncName string     `json:"funcName"`
	Cases    []TestCase `json:"cases"`
}

func loadManifest(t *testing.T, slug string) (starter string, m manifest) {
	t.Helper()
	dir := filepath.Join("..", "content", slug)

	starterBytes, err := os.ReadFile(filepath.Join(dir, "starter.go"))
	if err != nil {
		t.Fatalf("reading starter.go for %s: %v", slug, err)
	}
	testsBytes, err := os.ReadFile(filepath.Join(dir, "tests.json"))
	if err != nil {
		t.Fatalf("reading tests.json for %s: %v", slug, err)
	}
	if err := json.Unmarshal(testsBytes, &m); err != nil {
		t.Fatalf("parsing tests.json for %s: %v", slug, err)
	}
	return string(starterBytes), m
}

func evalHarness(t *testing.T, src string) string {
	t.Helper()
	var out bytes.Buffer
	i := interp.New(interp.Options{Stdout: &out, Stderr: &out})
	if err := i.Use(stdlib.Symbols); err != nil {
		t.Fatalf("failed to load stdlib symbols: %v", err)
	}
	if _, err := i.Eval(src); err != nil {
		t.Fatalf("yaegi eval failed: %v\nsource:\n%s", err, src)
	}
	return out.String()
}

func TestYaegiEval_RunsGeneratedHarnessAndReportsPassFail(t *testing.T) {
	student := "package main\n\nimport \"fmt\"\n\nfunc Sum(a, b int) int { return a + b }\n"
	cases := []TestCase{
		{Name: "adds_two_positives", ArgsGo: "2, 3", ExpectedGo: "5"},
		{Name: "wrong_on_purpose", ArgsGo: "2, 2", ExpectedGo: "5"},
	}

	output := evalHarness(t, GenerateHarness(student, "Sum", cases))
	results := ParseResults(output, cases)

	if !results[0].Passed {
		t.Fatalf("expected adds_two_positives to pass, got %+v", results[0])
	}
	if results[1].Passed || results[1].Got != "4" || results[1].Want != "5" {
		t.Fatalf("expected wrong_on_purpose to fail with got=4 want=5, got %+v", results[1])
	}
}

func TestYaegiEval_RunsGenericFunctionUnderTest(t *testing.T) {
	student := "package main\n\nimport \"fmt\"\n\nfunc Max[T int | float64](a, b T) T {\n\tif a > b {\n\t\treturn a\n\t}\n\treturn b\n}\n"
	cases := []TestCase{{Name: "int_max", ArgsGo: "3, 7", ExpectedGo: "7"}}

	output := evalHarness(t, GenerateHarness(student, "Max", cases))
	results := ParseResults(output, cases)

	if !results[0].Passed {
		t.Fatalf("expected generic Max call to pass, got %+v", results[0])
	}
}

func TestYaegiEval_Ch01StarterIsIncomplete(t *testing.T) {
	starter, m := loadManifest(t, "ch01-fundamentals")

	output := evalHarness(t, GenerateHarness(starter, m.FuncName, m.Cases))
	results := ParseResults(output, m.Cases)

	for _, r := range results {
		if r.Passed {
			t.Fatalf("expected the unmodified starter to fail every case, but %q passed", r.Name)
		}
	}
}

func TestYaegiEval_Ch01ReferenceSolutionPassesAllCases(t *testing.T) {
	_, m := loadManifest(t, "ch01-fundamentals")
	reference := "package main\n\nimport (\n\t\"fmt\"\n\t\"strconv\"\n)\n\n" +
		"func FizzBuzz(n int) string {\n" +
		"\tswitch {\n" +
		"\tcase n%15 == 0:\n\t\treturn \"FizzBuzz\"\n" +
		"\tcase n%3 == 0:\n\t\treturn \"Fizz\"\n" +
		"\tcase n%5 == 0:\n\t\treturn \"Buzz\"\n" +
		"\tdefault:\n\t\treturn strconv.Itoa(n)\n" +
		"\t}\n}\n\nvar _ = fmt.Sprint\n"

	output := evalHarness(t, GenerateHarness(reference, m.FuncName, m.Cases))
	results := ParseResults(output, m.Cases)

	for _, r := range results {
		if !r.Passed {
			t.Errorf("reference solution failed case %q: got %s want %s", r.Name, r.Got, r.Want)
		}
	}
}

// This documents, rather than asserts on, yaegi issue #1255: EvalWithContext
// cancellation does not reliably interrupt an already-running infinite loop
// inside the evaluated program. If this ever starts passing, worker-side
// terminate() is still required as the real backstop, but EvalWithContext
// could then also help as a fast path.
func TestYaegiEvalWithContext_DoesNotReliablyInterruptARunningInfiniteLoop(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping slow runaway-loop probe in -short mode")
	}
	src := "package main\n\nfunc main() {\n\tfor {}\n}\n"

	var out bytes.Buffer
	i := interp.New(interp.Options{Stdout: &out, Stderr: &out})
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	done := make(chan struct{})
	go func() {
		_, _ = i.EvalWithContext(ctx, src)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Log("confirmed: EvalWithContext did not return after its context expired; " +
			"worker.terminate() is required as the real timeout mechanism")
	}
}
