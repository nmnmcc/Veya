# Reference Repositories

This directory vendors external source repositories as local reference material
for coding agents. The intended shape follows the git subtree pattern from the
Effect article on giving agents real library source to inspect.

## effect-smol

- Upstream: `https://github.com/Effect-TS/effect-smol.git`
- Branch: `main`
- Current snapshot: `49aadc77c00f61efb6374f0d1f80ac8d8e4ced7f`
- Snapshot date: `2026-05-21`
- Snapshot subject: `add scratchpad skill (#2254)`

Use `.ref/effect-smol/` as read-only reference material for Effect-style module
layout, naming, constructors, guards, data-first/data-last combinators, tests,
and documentation. Do not import from `.ref/` in package source.

## Maintenance

For a fresh subtree setup, run from a clean worktree where
`.ref/effect-smol` does not already exist:

```sh
git subtree add \
  --prefix=.ref/effect-smol \
  https://github.com/Effect-TS/effect-smol.git \
  main \
  --squash
```

Once the initial subtree commit exists, update the vendored snapshot with:

```sh
git subtree pull \
  --prefix=.ref/effect-smol \
  https://github.com/Effect-TS/effect-smol.git \
  main \
  --squash
```
