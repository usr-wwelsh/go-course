# Concurrency II: Synchronization & Context

Channels aren't the only tool for concurrent code. Sometimes goroutines need to share a plain variable, which needs a mutex to stay safe; sometimes a whole call graph needs to know "stop now," which is what `context.Context` carries down through it.

## Concept

`sync.Mutex` provides mutual exclusion: `Lock()` blocks until no other goroutine holds the lock, `Unlock()` releases it, and code between the two runs as if no other goroutine could touch the same data at the same time. `context.Context` carries a cancellation signal (and optionally a deadline or request-scoped values) through a chain of function calls, so a caller can tell everything downstream to stop without every function in between needing its own ad-hoc mechanism.

## Explanation

Without a mutex, two goroutines incrementing the same `int` can race — both read the old value before either writes the new one, and an increment gets lost. A mutex serializes access:

```go
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}
```

`defer c.mu.Unlock()` right after `Lock()` is the idiom: it guarantees the lock is released even if the function returns early or panics, so `Lock`/`Unlock` calls can't drift out of balance as the function grows.

A `context.Context` is created with `context.Background()` at the root and derived downward. `context.WithCancel` returns a child context plus a `CancelFunc`; calling it closes the context's `Done()` channel, and that closure propagates to every context derived from it:

```go
ctx, cancel := context.WithCancel(context.Background())
cancel()
<-ctx.Done() // already closed, returns immediately
```

A function that wants to check cancellation without blocking pairs a receive on `Done()` with a `default` case in a `select`:

```go
select {
case <-ctx.Done():
    // cancelled
default:
    // not yet
}
```

`context.WithTimeout` and `context.WithDeadline` build on the same mechanism, cancelling automatically once the deadline passes — the receiving code doesn't need to know whether cancellation was manual or time-based, only that `Done()` fired.

## Usage

```go
package main

import (
    "context"
    "fmt"
    "sync"
)

func countTo(n int) int {
    var mu sync.Mutex
    var wg sync.WaitGroup
    total := 0
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            total++
            mu.Unlock()
        }()
    }
    wg.Wait()
    return total
}

func main() {
    fmt.Println(countTo(100)) // 100, every time — the mutex rules out lost updates

    parent, cancel := context.WithCancel(context.Background())
    child, _ := context.WithCancel(parent)
    cancel() // cancelling parent cancels every context derived from it
    select {
    case <-child.Done():
        fmt.Println("child cancelled too")
    default:
        fmt.Println("child still running")
    }
}
```

## Exercise

Implement `ContextDone(ctx context.Context) bool`: report whether `ctx` has already been cancelled (or had its deadline pass), without blocking. Use a `select` with a receive on `ctx.Done()` and a `default` case — this is the function the tests call.
