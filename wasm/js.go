//go:build js && wasm

// Entrypoint for the browser build: registers a global runExercise(studentCode,
// funcName, casesJSON) JS function backed by a yaegi interpreter.
package main

import (
	"bytes"
	"encoding/json"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

type response struct {
	Error   string   `json:"error,omitempty"`
	Results []Result `json:"results,omitempty"`
}

func runExercise(studentCode, funcName string, cases []TestCase) response {
	harness := GenerateHarness(studentCode, funcName, cases)

	var out bytes.Buffer
	i := interp.New(interp.Options{Stdout: &out, Stderr: &out})
	if err := i.Use(stdlib.Symbols); err != nil {
		return response{Error: err.Error()}
	}
	if _, err := i.Eval(harness); err != nil {
		return response{Error: err.Error()}
	}
	return response{Results: ParseResults(out.String(), cases)}
}

func marshalResponse(r response) string {
	b, err := json.Marshal(r)
	if err != nil {
		return `{"error":"internal: failed to marshal response"}`
	}
	return string(b)
}

func jsRunExercise(this js.Value, args []js.Value) any {
	if len(args) != 3 {
		return marshalResponse(response{Error: "runExercise expects (studentCode, funcName, casesJSON)"})
	}
	var cases []TestCase
	if err := json.Unmarshal([]byte(args[2].String()), &cases); err != nil {
		return marshalResponse(response{Error: "invalid test cases: " + err.Error()})
	}
	return marshalResponse(runExercise(args[0].String(), args[1].String(), cases))
}

func main() {
	js.Global().Set("runExercise", js.FuncOf(jsRunExercise))
	// Signal readiness explicitly rather than relying on timing assumptions
	// about how much of main() runs synchronously before go.run()'s caller
	// regains control in JS.
	js.Global().Call("__onWasmReady")
	select {}
}
