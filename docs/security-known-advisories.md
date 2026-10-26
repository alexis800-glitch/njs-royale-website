# Known dependency advisories

Last reviewed 26 October 2026, against `next@15.5.28`.

`npm audit` reports two entries. Both are the same root cause, and **no override
has been applied**. Forcing a resolution here would replace the copy of PostCSS
that Next.js compiled and tested against, which is a larger risk than the
advisories themselves.

## What is reported

| Package | Severity | Where it comes from |
| --- | --- | --- |
| `postcss@8.4.31` | high | bundled inside Next.js, at `node_modules/next/node_modules/postcss` |
| `next` | moderate | flagged only because it contains the copy above; Next itself carries no advisory of its own |

The top-level `postcss` that this project declares is already patched and sits
at 8.5.31. The vulnerable copy is Next's own, and is not reachable from
`package.json`.

### The four advisories

| Advisory | Severity | Fixed in | Requires |
| --- | --- | --- | --- |
| [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | moderate | 8.5.10 | XSS via an unescaped `</style>` in stringify output |
| [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | high | 8.5.12 | attacker-controlled `sourceMappingURL` in a CSS comment |
| [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | moderate | 8.5.23 | as above, when `from` is unset |
| [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | high | 8.5.18 | path traversal through source-map auto-loading |

## Why they are not exploitable here

Every one of them needs PostCSS to process CSS or a source map that an attacker
controls. In this application it processes neither.

- **PostCSS runs only at build time.** It compiles our own stylesheets through
  Tailwind and Autoprefixer (`postcss.config.js`). The result is written to
  static files under `.next/static/css`.
- **It is not shipped to the runtime.** A search of the production build finds
  zero references to `postcss` in `.next/server` and zero in `.next/static`.
  Nothing calls it in the request path.
- **There is no user-supplied CSS anywhere.** The site accepts no stylesheet
  upload, no theme input and no style parameter. The only API route takes JSON
  and writes a registration to Postgres.
- **The two `dangerouslySetInnerHTML` uses render JSON-LD** built from constants
  in `lib/`, with no request or user input reaching them.

Reaching these advisories would require the ability to put arbitrary CSS into
the repository and run a build, which already implies write access to the
source.

## What would clear them

Next.js updating the PostCSS copy it bundles. It is present in the 14.x line as
well, so this is not a regression introduced by the move to Next 15.

Re-check on each Next.js upgrade:

```
npm audit
find node_modules/next/node_modules/postcss -name package.json -exec \
  node -e "console.log(require('./'+process.argv[1]).version)" {} \;
```

**Do not** add a `overrides` entry for PostCSS to silence this. If the advisories
ever become reachable, the correct response is to upgrade Next.js.
