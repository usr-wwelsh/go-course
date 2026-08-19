# Testing, Tooling & Capstone

Go ships a testing framework in the standard library instead of leaving it to a third party, and the tooling built around it — `go test`, `go vet`, `gofmt` — is a big part of why Go code looks the same across unrelated projects. This last chapter covers that idiom, then closes the course with a capstone: an LRU cache, built from a struct, a doubly-linked list of pointers, and a map — the same pieces from chapters three, four, and nine, assembled into one real data structure.

## Concept

`go test` finds every function shaped like `func TestXxx(t *testing.T)` in a `_test.go` file and runs it. Inside, `t.Errorf` records a failure and lets the test keep running so later assertions still get a chance to fail too; `t.Fatalf` records a failure and stops that test immediately, for when continuing wouldn't make sense (a nil you're about to dereference, say).

The idiomatic shape for testing a function against several inputs is a table-driven test: a slice of cases, run through a loop, each wrapped in its own `t.Run` so a failure is reported by case name instead of just a line number.

## Explanation

```go
func TestDivide(t *testing.T) {
    cases := []struct {
        name    string
        a, b    int
        want    string
    }{
        {"exact_division", 10, 2, "5"},
        {"division_by_zero", 4, 0, "division by zero"},
    }
    for _, c := range cases {
        t.Run(c.name, func(t *testing.T) {
            if got := Divide(c.a, c.b); got != c.want {
                t.Errorf("Divide(%d, %d) = %q, want %q", c.a, c.b, got, c.want)
            }
        })
    }
}
```

`t.Run(c.name, ...)` isn't just organizational — it makes each case an independently addressable subtest (`go test -run TestDivide/division_by_zero` runs only that one). The closure inside it captures `c` from the loop, which is safe here for the same reason chapter seven's goroutine loop-variable discussion pointed at: each iteration since Go 1.22 gets its own `c`, so every subtest closes over its own case instead of whatever the loop left behind.

That table is also, not coincidentally, what's running every time you click **Run** in this course: every chapter's `tests.json` is a table of cases, and the checker builds the same loop-and-compare structure around your function that `TestDivide` builds by hand here. Table-driven tests aren't a special technique reserved for library authors — they're the default shape for testing anything with more than one interesting input.

`go vet` and `gofmt` round out the toolchain: `vet` catches mistakes that compile fine but are almost certainly bugs (a `Printf` format string that doesn't match its arguments, a struct copied by value that contains a mutex), and `gofmt` removes formatting as a decision anyone has to make at all — every `.go` file in existence is one canonical shape.

## Usage

```
$ go test -v ./...
=== RUN   TestDivide
=== RUN   TestDivide/exact_division
=== RUN   TestDivide/division_by_zero
--- PASS: TestDivide (0.00s)
    --- PASS: TestDivide/exact_division (0.00s)
    --- PASS: TestDivide/division_by_zero (0.00s)
PASS
ok      example.com/mymodule    0.002s
```

Each subtest gets its own `PASS`/`FAIL` line named after `c.name` — the same visible-case names you've seen in every exercise's results panel so far, and the same reason this course's hidden cases have names too, even though you never see them pass or fail individually.

## Exercise

Build an LRU (least-recently-used) cache: a fixed-capacity key/value store that, when a `Put` would exceed capacity, evicts whichever entry was least recently touched by `Get` or `Put`. Both operations need to run in O(1), which rules out scanning for the oldest entry — instead, keep a `map[int]*lruNode` for O(1) lookup by key, alongside a doubly-linked list of nodes ordered by recency, with `head`/`tail` sentinel nodes so the list is never empty and every insert/remove is a fixed handful of pointer rewrites, no edge cases for "is this the first node."

Implement, on the `*LRUCache` receiver:

- `remove(n *lruNode)` — unlink `n` from wherever it currently sits in the list.
- `pushFront(n *lruNode)` — link `n` in as the new most-recently-used entry, right after `head`.
- `Get(key int) int` — if `key` is present, move its node to the front (most-recently-used) and return its value; otherwise return `-1`.
- `Put(key, value int)` — if `key` already exists, update its value and move it to the front; otherwise create a node and push it to the front, evicting the node just before `tail` first if the cache is at capacity.

And `NewLRUCache(capacity int) *LRUCache`, which should initialize `head` and `tail` as linked sentinels (`head.next = tail`, `tail.prev = head`) before any real entries exist.

Finally, implement `RunLRU(capacity int, ops []string, keys, values []int) []int`, which constructs an `LRUCache` and applies `ops[i]` (either `"get"` or `"put"`) using `keys[i]` and, for a put, `values[i]`, collecting the return value of every `"get"` call in order — this is the function the tests call, and it's deliberately shaped like a table-driven test's case list: a sequence of operations, run in order, checked against what should come out.
