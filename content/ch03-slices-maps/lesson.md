# Slices, Arrays & Maps

Arrays in Go have a fixed length baked into their type — `[5]int` and `[10]int` are different types. Almost nobody uses arrays directly; the collection type you reach for is a slice, a resizable view over an underlying array that Go manages for you.

## Concept

A slice is three words: a pointer to backing storage, a length, and a capacity. `len(s)` is how many elements it holds; `cap(s)` is how many it could hold before the backing array needs to grow. A map is Go's built-in hash table, declared `map[KeyType]ValueType`, with no guaranteed iteration order.

## Explanation

Build a slice with a literal, `make`, or by slicing an existing array/slice:

```go
nums := []int{1, 2, 3}
buf := make([]int, 0, 10) // len 0, cap 10
sub := nums[1:3]          // shares backing storage with nums
```

`append` adds elements, growing the backing array (and reallocating) if capacity runs out:

```go
nums = append(nums, 4, 5)
```

Because a slice shares its backing array with whatever it was sliced from, mutating through one slice can be visible through another — `sub[0] = 99` also changes `nums[1]`. `append` breaks that sharing the moment it has to reallocate, which is a common source of subtle bugs when code assumes aliasing that silently stopped holding.

Maps work with indexing and a two-value form that reports whether a key was present, which matters because the zero value and "missing" look identical otherwise:

```go
m := map[string]int{"a": 1}
v := m["a"]          // 1
v, ok := m["z"]      // 0, false — "z" isn't there, this isn't a zero value in disguise
m["b"] = 2
delete(m, "a")
```

`for range` walks both: index and value for a slice, key and value for a map (in random order — never rely on map iteration order).

## Usage

```go
package main

import "fmt"

func wordCount(words []string) map[string]int {
    counts := make(map[string]int)
    for _, w := range words {
        counts[w]++
    }
    return counts
}

func main() {
    counts := wordCount([]string{"go", "is", "fun", "go", "is", "go"})
    fmt.Println(counts["go"]) // 3
}
```

`counts[w]++` works even the first time a key is seen: reading a missing map key returns the value type's zero value, `0` for `int`, so the increment starts from zero without any explicit initialization check.

## Exercise

Implement `MostFrequent(words []string) string`: return the string that appears most often in `words`. If there's a tie, return the one that appears first in `words` among the tied candidates. `words` is never empty.
