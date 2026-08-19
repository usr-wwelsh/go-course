package main

import "fmt"

// node is one element of a binary search tree.
type node struct {
	value       int
	left, right *node
}

// insert adds v into the tree rooted at n, returning the (possibly new)
// root. Values equal to an existing node's value go to its right subtree.
func insert(n *node, v int) *node {
	// TODO: implement me
	return n
}

// inOrder appends the tree's values to dst in ascending order.
func inOrder(n *node, dst []int) []int {
	// TODO: implement me
	return dst
}

// SortViaBST inserts every value in nums into a binary search tree and
// returns them in ascending order via an in-order traversal.
func SortViaBST(nums []int) []int {
	// TODO: implement me
	return nil
}

var _ = fmt.Sprint
