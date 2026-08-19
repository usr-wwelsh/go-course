package main

import "fmt"

// lruNode is one entry in the cache's doubly-linked list, ordered from
// most-recently-used (front) to least-recently-used (back).
type lruNode struct {
	key, value int
	prev, next *lruNode
}

// LRUCache is a fixed-capacity cache that evicts its least-recently-used
// entry when a Put would exceed capacity. A map gives O(1) lookup by key;
// a doubly-linked list (with head/tail sentinels, same trick as a real
// container/list) gives O(1) reordering and eviction.
type LRUCache struct {
	capacity   int
	nodes      map[int]*lruNode
	head, tail *lruNode // sentinels: head.next is most-recent, tail.prev is least-recent
}

// NewLRUCache constructs an empty cache with the given capacity.
func NewLRUCache(capacity int) *LRUCache {
	// TODO: implement me
	return nil
}

// remove unlinks n from the list. n must already be linked in.
func (c *LRUCache) remove(n *lruNode) {
	// TODO: implement me
}

// pushFront links n in as the most-recently-used entry.
func (c *LRUCache) pushFront(n *lruNode) {
	// TODO: implement me
}

// Get returns the value stored for key and marks it most-recently-used,
// or returns -1 if key isn't present.
func (c *LRUCache) Get(key int) int {
	// TODO: implement me
	return 0
}

// Put inserts or updates key's value and marks it most-recently-used,
// evicting the least-recently-used entry first if the cache is already
// at capacity.
func (c *LRUCache) Put(key, value int) {
	// TODO: implement me
}

// RunLRU builds an LRUCache of the given capacity and applies ops in
// order. ops[i] is "get" or "put"; keys[i] is the key for that op;
// values[i] is the value for a "put" (ignored for "get"). It returns the
// result of each "get" call, in order — this is the function the tests
// call.
func RunLRU(capacity int, ops []string, keys, values []int) []int {
	// TODO: implement me
	return nil
}

var _ = fmt.Sprint
