//go:build !(js && wasm)

// This file exists only so `go build`/`go test` work on the developer's
// native platform; the real entrypoint is js.go, built with GOOS=js GOARCH=wasm.
package main

func main() {}
