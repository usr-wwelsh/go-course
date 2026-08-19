package main

import "fmt"

// Shape is anything that knows its own area.
type Shape interface {
	Area() float64
}

// Square is a Shape with equal sides.
type Square struct {
	Side float64
}

// Area returns the square's side squared.
func (s Square) Area() float64 {
	// TODO: implement me
	return 0
}

// TotalArea sums the Area() of every shape in shapes.
func TotalArea(shapes []Shape) float64 {
	// TODO: implement me
	return 0
}

var _ = fmt.Sprint
