# Review mode — client feedback

A commenting layer for the live site. The owner opens a private link, taps
anything on the page, types a note, optionally attaches a photo, and it
arrives as a GitHub issue in this repo. They need no GitHub account, no login,
no app.

Public visitors see nothing and download nothing.

---

## How it works

```
 ?review=<key>  →  feedback chrome (lazy chunk)  →  POST /api/feedback  →  GitHub issue
                                                        ↓ (if a photo)
                                                 feedback-assets branch
                                                        ↓
                                                   /api/shot  →  inline image in the issue
```

| File | Role |
| --- | --- |
| `src/scripts/review-gate.js` | The only feedback code the public runs: a few lines that check for review mode and dynamic-import the chrome. Loaded on every page via the layout. |
| `src/scripts/feedback-chrome.js` + `.css` | The widget's chrome: strings, palette, DOM, interaction. **Restyle the CSS in this site's terms** — the template palette is neutral on purpose. Its mechanics come from `@shaahink/sitekit/widget`. |
| `api/feedback.js` | Reads this deployment's environment and hands off to `@shaahink/sitekit/feedback`. **Set the locales and time zone for this site.** |
| `api/shot.js` | Same shape over `@shaahink/sitekit/shot`, which serves stored screenshots so GitHub can render them. |
| `vercel.json` | Stops the screenshot branch from triggering deployments. Generated from `headers.config.mjs`. |

Screenshots live on an orphan `feedback-assets` branch, detached from the
site's history and carrying its own `vercel.json` that disables deploys. It is
created automatically on the first photo.

---

## One-time setup

### 1. Install the `sk-feedback` GitHub App on this repo

There is no token to create. The fleet moved off personal access tokens in
session 7: a PAT belongs to a person, expires, and authors every issue and
commit in their name, which is a poor thing for a client's site to depend on.
The App is installed across all repositories, mints a short-lived token per
request, and signs its work as `sk-feedback[bot]`.

So step 1 is to confirm the installation covers this repo —
<https://github.com/settings/installations> — and to have the App's id,
installation id and PKCS#8 private key to hand. The control room's `CONFIG.md`
records where they live.

⚠ **A GitHub API 404 can mean "the installation cannot see this repo", not
"no such file".** If the editor saves fail as missing files, check coverage
before you check paths.

### 2. Add environment variables in Vercel

Project → Settings → Environment Variables (all three environments):

| Name | Value |
| --- | --- |
| `FEEDBACK_GITHUB_APP_ID` | the App's id — `gh api apps/sk-feedback` returns it |
| `FEEDBACK_GITHUB_APP_PRIVATE_KEY` | PKCS#8 only — GitHub hands out PKCS#1 |
| `FEEDBACK_GITHUB_APP_INSTALLATION_ID` | the installation covering this repo |
| `FEEDBACK_GITHUB_REPO` | `shaahink/<this-repo>` |
| `FEEDBACK_REVIEW_KEY` | any secret word |
| `FEEDBACK_SITE_URL` | the real production URL |

Convert the key once, before it ever reaches an environment variable:
`openssl pkcs8 -topk8 -nocrypt -in app.pem`. Web Crypto cannot import PKCS#1.

`FEEDBACK_SITE_URL` matters: it is the origin GitHub uses to fetch screenshots,
so it must be the real public URL, not a preview deployment.

Set values from bash with `printf '%s' "<value>" | vercel env add <NAME> <env>`
— piping from PowerShell appends a newline and the key comparison fails
forever after (an hour of 401s taught the fleet this).

### 3. Send the link

`https://<site>/?review=<key>` — review mode persists across pages and visits
on that device until `?review=off`.

Record the live link below once the key exists — private repo, and the token
above only reaches this same repo.

---

## Live link

_Not yet issued — set the environment variables, then record the link here._
