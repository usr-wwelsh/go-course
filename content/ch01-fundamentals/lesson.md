# Go Fundamentals

## Concept

A Go program is a `package`, a set of imports, and a list of declarations. There is no implicit global scope beyond the package, no header files, and exactly one way to format code (`gofmt`). Variables are statically typed, but the type is usually inferred rather than written out.

## Explanation

Declare a variable with `var name Type` or, inside a function, with `name := value` — the `:=` form infers the type from the right-hand side. Both forms produce a fully-typed variable; Go never falls back to a dynamic "any" type unless you ask for one with `any`.

Control flow has three shapes, and no more: `if`, `for`, and `switch`. There is no `while` — `for` alone covers it. There are no parentheses around the condition, but the braces are mandatory even for a single statement.

```go
func classify(n int) string {
    if n < 0 {
        return "negative"
    }

    for n > 9 {
        n -= 10
    }

    switch n {
    case 0:
        return "zero"
    default:
        return "single digit"
    }
}
```

Every `.go` file lives in exactly one package, declared at the top with `package name`. An executable program has a `package main` with a `func main()` — that's the entry point `go run` looks for.

## Usage

```go
package main

import "fmt"

func classify(n int) string {
    if n%2 == 0 {
        return "even"
    }
    return "odd"
}

func main() {
    fmt.Println(classify(4)) // "even"
    fmt.Println(classify(7)) // "odd"
}
```

Compile and run this with `go run main.go`, or build a binary with `go build`. No project file beyond `go.mod` is required to get started.

Go won't silently convert an `int` to a `string` for you — `"n = " + n` is a compile error. To turn a number into its decimal string, use `strconv.Itoa`:

```go
import "strconv"

strconv.Itoa(42) // "42"
```

## Exercise

Implement `FizzBuzz(n int) string`: return `"Fizz"` if `n` is divisible by 3, `"Buzz"` if divisible by 5, `"FizzBuzz"` if divisible by both, and the decimal string of `n` otherwise.
