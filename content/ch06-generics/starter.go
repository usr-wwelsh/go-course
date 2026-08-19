package main

import "fmt"

// Stack is a LIFO stack of any element type.
type Stack[T any] struct {
	items []T
}

// Push appends v to the top of the stack.
func (s *Stack[T]) Push(v T) {
	// TODO: implement me
}

// Pop removes and returns the top of the stack. The second return value is
// false when the stack is empty.
func (s *Stack[T]) Pop() (T, bool) {
	// TODO: implement me
	var zero T
	return zero, false
}

// Reversed returns a new slice holding items in reverse order.
func Reversed[T any](items []T) []T {
	// TODO: implement me
	return nil
}

var _ = fmt.Sprint
