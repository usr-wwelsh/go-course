# Go, by Doing

[![Read about the commits](https://img.shields.io/badge/commits-code%20blog-1a1a1a?style=flat-square)](https://wwel.sh/digest.html?repo=go-course)

A ten-chapter, browser-based Go course. Each chapter is a short lesson followed by a function to implement, checked against real test cases entirely client-side — no signup, no install, nothing sent to a server.

Code is compiled and run in-browser by [yaegi](https://github.com/traefik/yaegi), a Go interpreter compiled to WebAssembly. There's no backend: the interpreter, the test cases, and your code all run in the tab.

## Layout

- `content/` — the lessons. One directory per chapter (`chNN-slug/`), each with `lesson.md`, `starter.go`, and `tests.json` (function name + input/output cases, some hidden).
- `wasm/` — the Go program compiled to `GOOS=js GOARCH=wasm`. Builds a harness around student code from a chapter's `tests.json` and runs it through yaegi.
- `site/` — the static frontend (TypeScript, esbuild, CodeMirror) that renders lessons, runs the WASM worker, and tracks progress in `localStorage`.

## Building

```sh
# WASM runner (outputs to site/public/)
./wasm/build.sh

# site (outputs to site/dist/)
cd site
npm install
npm run build   # or: npm run dev (watch mode), npm run serve (serve dist/)
```

## Testing

```sh
go test ./wasm/...
```

## License

MIT — see [LICENSE](LICENSE).

The Go gopher used for the site favicon and social preview image was designed by [Renee French](https://reneefrench.blogspot.com/) and is licensed under [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).
