# Functions & Error Handling

Go functions can return multiple values, and idiomatic Go uses that to make failure part of a function's signature instead of an exception that silently unwinds the stack. There's no `try`/`catch`. An `error` is just a value — you check it like any other value, right where it's produced.

## Concept

A function's return types are part of its signature: `func f(a, b int) (int, error)` returns two values every time, not one value that's sometimes an error. Callers are expected to check the `error` result immediately, not defer it or let it propagate implicitly.

## Explanation

By convention, an error-returning function puts the `error` last, and callers check it right after the call:

```go
result, err := doSomething()
if err != nil {
    return err
}
```

`error` is an interface with one method, `Error() string`. `errors.New` and `fmt.Errorf` build simple ones; `fmt.Errorf` with a `%w` verb wraps an underlying error so `errors.Is` and `errors.As` can still find it later:

```go
if err != nil {
    return fmt.Errorf("loading config: %w", err)
}
```

A nil error means success — always compare against `nil`, never against a zero value of some other type. Functions can also return named results, which let you set the return value and `return` with no arguments, but named results are for readability, not a requirement.

Go also has `panic` and `recover`, but they're not a general error-handling mechanism. `panic` is for programmer errors — an invariant that should never break, like an out-of-bounds index — not for conditions like "file not found" that a caller should be able to handle.

## Usage

```go
package main

import (
    "errors"
    "fmt"
)

var errDivByZero = errors.New("division by zero")

func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errDivByZero
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 0)
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Println(result)
}
```

Sentinel errors like `errDivByZero` let callers compare with `errors.Is(err, errDivByZero)` even after the error has been wrapped a few layers up the call stack.

## Exercise

Implement `Divide(a, b int) string`: return the decimal string of `a / b` (integer division) when `b` is not zero, and the string `"division by zero"` when `b` is zero. In real code this would be a job for `(int, error)` and a caller that checks `err != nil` — here it's collapsed to a single string so the result is easy to check directly.
