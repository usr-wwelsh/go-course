# Data Structures & Algorithms in Go

Go's standard library gives you a slice and a map — it doesn't ship a linked list, tree, or heap type. Building one is just structs and pointers, the same tools from earlier chapters, and generics mean you write it once rather than once per element type.

## Concept

A pointer-linked data structure is built from a node type that holds a value and pointers to its neighbors; `nil` marks "no neighbor here" the same way it marks a missing map entry. Recursion is the natural way to walk these structures: a function that handles the base case (`nil`) and otherwise does a little work before recursing into the neighbors, mirroring the structure's own shape.

## Explanation

A binary search tree keeps every left descendant's value less than its own and every right descendant's value greater-or-equal, which makes both insertion and lookup a walk that halves the remaining space at each step:

```go
type node struct {
    value       int
    left, right *node
}

func insert(n *node, v int) *node {
    if n == nil {
        return &node{value: v}
    }
    if v < n.value {
        n.left = insert(n.left, v)
    } else {
        n.right = insert(n.right, v)
    }
    return n
}
```

`insert` returns the (possibly new) root of the subtree it was given, so the caller reassigns: `root = insert(root, v)`. That pattern — recurse, then reattach the result — is how Go code rebuilds pointer structures immutably-by-convention without needing a separate parent pointer.

An in-order traversal (left subtree, then this node, then right subtree) visits a binary search tree's values in ascending order, for free, purely as a consequence of the ordering invariant `insert` maintains:

```go
func inOrder(n *node, dst []int) []int {
    if n == nil {
        return dst
    }
    dst = inOrder(n.left, dst)
    dst = append(dst, n.value)
    dst = inOrder(n.right, dst)
    return dst
}
```

Threading `dst` through the recursive calls and returning the grown slice avoids allocating a fresh slice at every level — each call just keeps appending to the one its caller is building.

## Usage

```go
package main

import "fmt"

func main() {
    var root *node
    for _, v := range []int{5, 3, 8, 1, 4} {
        root = insert(root, v)
    }
    fmt.Println(inOrder(root, nil)) // [1 3 4 5 8]
}
```

The values went in unsorted; the tree's shape — not any sorting step — is what makes the traversal come out ordered.

## Exercise

Implement `insert(n *node, v int) *node` and `inOrder(n *node, dst []int) []int` as described above (values equal to an existing node's value go to its right subtree). Then implement `SortViaBST(nums []int) []int`, which inserts every value in `nums` into a binary search tree, one at a time starting from an empty (`nil`) tree, and returns them in ascending order via an in-order traversal — this is the function the tests call.
