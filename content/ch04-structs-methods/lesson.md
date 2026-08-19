# Structs, Methods & Composition

Go has no classes. A `struct` groups fields together, and a method is a function with an extra receiver argument bound to a type — that's the entire toolkit, and it's enough to build the same designs classes are usually reached for.

## Concept

A `struct` is a typed collection of fields. A method is declared with a receiver — `func (r Type) Name(...)` — and can be called on values of that type with `value.Name(...)`. Go has no inheritance; instead, embedding one struct inside another promotes the embedded type's fields and methods onto the outer type.

## Explanation

Define a struct and attach methods with either a value or pointer receiver:

```go
type Point struct {
    X, Y int
}

func (p Point) String() string {
    return fmt.Sprintf("(%d, %d)", p.X, p.Y)
}

func (p *Point) Scale(factor int) {
    p.X *= factor
    p.Y *= factor
}
```

A value receiver gets its own copy of the struct — mutations inside the method don't escape it. A pointer receiver operates on the original, so it's what you need whenever the method mutates state, and it's also the cheaper choice for large structs since it avoids a copy. Go automatically takes the address for you when you call a pointer-receiver method on an addressable value, so `p.Scale(2)` works even though `Scale`'s receiver is `*Point`.

Embedding puts one struct inside another with no field name, and the outer type gets the inner one's fields and methods for free:

```go
type Base struct {
    ID int
}

func (b Base) Describe() string {
    return fmt.Sprintf("id=%d", b.ID)
}

type User struct {
    Base
    Name string
}

u := User{Base: Base{ID: 1}, Name: "ana"}
u.Describe() // "id=1" — promoted from Base, no forwarding method needed
```

This is composition, not inheritance: `User` doesn't become a `Base`, it just has one, and its methods are reachable through the outer value because the compiler promotes them.

## Usage

```go
package main

import "fmt"

type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func main() {
    r := Rectangle{Width: 3, Height: 4}
    fmt.Println(r.Area()) // 12
}
```

## Exercise

Implement a `Rectangle` struct with `Width` and `Height float64` fields, and a method `Area() float64` on it that returns `Width * Height`. Then implement `MakeRectangle(width, height float64) Rectangle` that constructs one from its arguments — this is the function the tests call.
