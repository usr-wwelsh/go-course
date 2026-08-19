package main

import "fmt"

// Rectangle has a width and a height.
type Rectangle struct {
	Width, Height float64
}

// Area returns the rectangle's width times its height.
func (r Rectangle) Area() float64 {
	// TODO: implement me
	return 0
}

// MakeRectangle constructs a Rectangle from width and height.
func MakeRectangle(width, height float64) Rectangle {
	// TODO: implement me
	return Rectangle{}
}

var _ = fmt.Sprint
