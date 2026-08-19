# Concurrency I: Goroutines & Channels

Go's concurrency is built into the language, not bolted on as a library. A `go` statement launches a function to run concurrently, and a channel is a typed pipe those goroutines use to pass values back and forth safely instead of reaching into each other's memory.

## Concept

A goroutine is a lightweight function invocation that runs concurrently with the rest of the program — `go f()` starts one and returns immediately, without waiting for `f` to finish. A channel, `chan T`, is a typed conduit: one goroutine sends a value with `ch <- v`, another receives it with `v := <-ch`, and the receive blocks until a value is available. Go's mantra is "don't communicate by sharing memory; share memory by communicating" — channels are the preferred way for goroutines to hand data to each other.

## Explanation

An unbuffered channel synchronizes sender and receiver: the send blocks until something is ready to receive, and vice versa.

```go
ch := make(chan int)
go func() {
    ch <- 42 // blocks until someone receives
}()
fmt.Println(<-ch) // 42
```

A buffered channel, `make(chan int, 3)`, lets sends proceed without a waiting receiver until the buffer fills. `close(ch)` signals that no more values are coming; `for v := range ch` reads until the channel is closed, and a two-value receive `v, ok := <-ch` reports `false` for `ok` once it's drained and closed.

Because goroutines finish on their own schedule, code that needs to wait for a group of them uses `sync.WaitGroup`: `Add` before launching each one, `Done` (usually deferred) when it finishes, and `Wait` blocks until the count returns to zero.

```go
var wg sync.WaitGroup
for i := 0; i < 3; i++ {
    wg.Add(1)
    go func(i int) {
        defer wg.Done()
        fmt.Println(i)
    }(i)
}
wg.Wait()
```

Passing `i` as a parameter matters — capturing the loop variable directly in the closure used to be a classic bug (all goroutines seeing the same, final `i`) before Go 1.22 gave each iteration its own copy, and passing it explicitly stays correct regardless of the Go version reading the code.

## Usage

```go
package main

import (
    "fmt"
    "sync"
)

func squareAll(nums []int) []int {
    result := make([]int, len(nums))
    var wg sync.WaitGroup
    for i, n := range nums {
        wg.Add(1)
        go func(i, n int) {
            defer wg.Done()
            result[i] = n * n
        }(i, n)
    }
    wg.Wait()
    return result
}

func main() {
    fmt.Println(squareAll([]int{1, 2, 3})) // [1 4 9], regardless of goroutine finish order
}
```

Writing to `result[i]` by index, rather than appending values as they arrive on a channel, keeps the output order deterministic even though the goroutines themselves finish in an unpredictable order.

## Exercise

Implement `SumConcurrent(nums []int) int`: launch one goroutine per element of `nums` that sends its value on a channel, and total the values received on that channel to produce the sum. Use a `sync.WaitGroup` (plus a goroutine that closes the channel once every sender is done) so the receiving loop knows when to stop — this is the function the tests call.
