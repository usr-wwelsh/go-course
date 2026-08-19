# Go, by Doing

Ten chapters. Each one is a short lesson followed by a real function to implement, checked against real test cases, entirely in this page — no signup, no install, nothing sent to a server.

## What this is

Every chapter follows the same shape: a short lesson (concept, explanation, a worked example), then an exercise — a function signature and a `TODO`. You write the implementation in the editor, click **Run**, and your code is compiled and executed by a real Go interpreter ([yaegi](https://github.com/traefik/yaegi)) running client-side as WebAssembly. There's no backend: the interpreter, the test cases, and your code all run in this browser tab.

Each exercise checks a handful of visible cases plus a few hidden ones, so passing means the implementation actually generalizes, not that it happens to match the one example shown.

## Why Go

Go trades expressiveness for readability: one way to format a file, one way to handle an error, a language spec small enough to hold in your head. It compiles fast, ships as a single static binary with no runtime to install, and has concurrency primitives built into the language instead of bolted on as a library. That combination is why it's the default choice for CLIs, network services, and infrastructure tooling — anywhere you want code a stranger (including future you) can read without a decoder ring.

## Who this is for

You should already be comfortable with variables, functions, loops, and conditionals in at least one other language. This isn't a zero-to-programmer course — it's a fast, hands-on run through Go's syntax, standard idioms, and standard library, for someone who already knows how to think like a programmer and just needs the Go-specific parts.

## Free and open

Everything here — the lessons, the exercises, the site itself — is MIT-licensed and free to use, fork, or self-host. Source is at [github.com/usr-wwelsh/go-course](https://github.com/usr-wwelsh/go-course). No account, no analytics, no paywall between you and chapter two. Software ownership shouldn't cost money.

Built and maintained by William Welsh — [wwel.sh](https://wwel.sh) — one of a number of free, offline-first, self-hostable tools published under that name.

## How this was built

This course was built with Claude Code, as a way to actually learn Go rather than just read about it: every lesson, exercise, and hidden test case was written while working through Go's fundamentals for real. If a later chapter's phrasing feels a little more assured than an earlier one, that's the learning curve showing, not an inconsistency worth chasing out.

## Your progress is cached, not tracked

Whatever you type into an exercise's editor is saved to `localStorage` after a short pause, so refreshing the page or coming back tomorrow won't lose your work. Once a chapter's exercise passes every test case — visible and hidden — it's marked complete and gets a checkmark in the sidebar, also stored in `localStorage`.

None of this touches a server. It lives only in this browser, on this device. Clearing your browser's site data resets it. There's no account to lose access to and nothing to migrate if you switch machines — that's the tradeoff, and for a free course with no login, it's the right one.

## How to follow along

Work through the chapters in order — later ones lean on earlier ones. For each chapter:

1. Read the lesson. It's short on purpose; skim the code blocks rather than just the prose.
2. Read the exercise prompt at the bottom, then implement the function in the editor. The starter file compiles as-is — it just returns zero values — so "not implemented yet" always fails loudly instead of silently.
3. Click **Run**. Visible failures show what your code returned versus what was expected; hidden cases only show pass or fail, so you can't just special-case the visible examples.
4. Stuck, or want a clean slate? **Reset** discards your changes and puts the starter code back — your autosave is overwritten, not the exercise itself.

There's no timer and no scoring beyond pass/fail. Take as long as a chapter needs.
