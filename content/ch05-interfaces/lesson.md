# Interfaces & Polymorphism

Go interfaces are satisfied implicitly — there's no `implements` keyword. If a type has the methods an interface asks for, it satisfies that interface automatically, even in a package that has never heard of the interface. That's what lets small interfaces compose across unrelated packages without either side coordinating.

## Concept

An interface is a set of method signatures. Any type whose method set includes all of them satisfies the interface, with no declaration linking the two. A variable of interface type can hold any value whose type satisfies it, and calling a method on it dispatches to that concrete type's implementation.

## Explanation

Declare an interface as a list of methods:

```go
type Shape interface {
    Area() float64
}
```

Any type with an `Area() float64` method satisfies `Shape`, whether or not its author ever imported the package `Shape` lives in:

```go
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

var s Shape = Circle{Radius: 2} // fine — Circle has Area(), so it satisfies Shape
```

Small interfaces compose well: `io.Reader` and `io.Writer` are each one method, and most of the standard library is built by asking for exactly the methods a function needs rather than a large, concrete type. The empty interface `any` (an alias for `interface{}`) is satisfied by every type, since it asks for nothing — useful sparingly, at real boundaries where the type genuinely isn't known, not as a way to avoid deciding on a type.

A type switch inspects the concrete type behind an interface value at runtime:

```go
func describe(s Shape) string {
    switch v := s.(type) {
    case Circle:
        return fmt.Sprintf("circle r=%.1f", v.Radius)
    default:
        return "shape"
    }
}
```

The single-result type assertion `v := s.(Circle)` panics if `s` doesn't hold a `Circle`; the two-result form `v, ok := s.(Circle)` reports failure via `ok` instead of panicking, the same pattern the two-value map lookup uses.

## Usage

```go
package main

import (
    "fmt"
    "math"
)

type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

type Square struct {
    Side float64
}

func (s Square) Area() float64 {
    return s.Side * s.Side
}

func totalArea(shapes []Shape) float64 {
    var total float64
    for _, s := range shapes {
        total += s.Area()
    }
    return total
}

func main() {
    shapes := []Shape{Circle{Radius: 1}, Square{Side: 2}}
    fmt.Println(totalArea(shapes)) // same loop, two concrete types
}
```

`totalArea` never mentions `Circle` or `Square` — it only knows about `Shape`, so a third shape type could be added later without changing this function at all.

## Exercise

Define an interface `Shape` with a method `Area() float64`. Define a type `Square` with a `Side float64` field and an `Area() float64` method that returns `Side * Side`. Then implement `TotalArea(shapes []Shape) float64`, which sums the `Area()` of every shape in the slice — this is the function the tests call.
