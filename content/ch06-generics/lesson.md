# Generics

Before generics, writing a container or algorithm that worked for any type meant either copy-pasting per type or falling back to `interface{}` and losing type safety at every call site. A type parameter lets a function or type stay generic over the element type while the compiler still checks it at compile time.

## Concept

A type parameter is declared in square brackets before the regular parameter list: `func Name[T Constraint](...)`. `T` stands in for a real type that's filled in — usually inferred from the arguments — at each call site. A constraint is an interface that limits which types `T` may be; `any` (an alias for `interface{}`) permits every type, and a union like `int | float64` permits exactly those.

## Explanation

A generic function is written once and works for every type that satisfies its constraint:

```go
func Max[T int | float64](a, b T) T {
    if a > b {
        return a
    }
    return b
}

Max(3, 7)     // T inferred as int
Max(1.5, 2.5) // T inferred as float64
```

Types can take type parameters too, and their methods carry the same parameter:

```go
type Box[T any] struct {
    value T
}

func (b *Box[T]) Set(v T) {
    b.value = v
}

func (b *Box[T]) Get() T {
    return b.value
}

var b Box[string]
b.Set("hi")
b.Get() // "hi"
```

`comparable` is a built-in constraint satisfied by any type usable with `==`, useful for anything keying a map or checking equality generically. Beyond a handful of built-in constraints (`any`, `comparable`), most real constraints are just interfaces — either a method set or, like `int | float64` above, a union of permitted types.

## Usage

```go
package main

import "fmt"

func Filter[T any](items []T, keep func(T) bool) []T {
    var result []T
    for _, v := range items {
        if keep(v) {
            result = append(result, v)
        }
    }
    return result
}

func main() {
    evens := Filter([]int{1, 2, 3, 4, 5}, func(n int) bool { return n%2 == 0 })
    fmt.Println(evens) // [2 4]
}
```

`Filter` never mentions `int` — the same function filters a `[]string` or a `[]Point` just as well, with `T` inferred fresh at each call.

## Exercise

Define a generic type `Stack[T any]` with a `Push(v T)` method that appends to it and a `Pop() (T, bool)` method that removes and returns the last-pushed value, reporting `false` via the second return when the stack is empty. Then implement `Reversed[T any](items []T) []T`, which returns a new slice holding `items` in reverse order — build it by pushing every element onto a `Stack[T]` and popping them back off — this is the function the tests call.
