# HiveMind fork governance

This repository is the Clickt-owned Kaneo fork. Kaneo remains Kaneo internally: package scopes, application names, chart names, environment variables, and code-level identifiers should not be renamed merely because the repository is a fork. That keeps upstream review and synchronization tractable.

## Repository authority and baseline

| Role | Repository | Local remote | Authority |
| --- | --- | --- | --- |
| Fork | `performance-clickt/kaneo` | `origin` | Fork branches, pull requests, and the fork's `main` branch |
| Canonical upstream | `usekaneo/kaneo` | `upstream` | Upstream changes to review and import; never a push target |

The fork baseline is upstream commit `3fc77f001df9af08257995e11f133a03cce6b6f7`, the `v2.18.0` release commit (`package.json` and `charts/kaneo/Chart.yaml` both report `2.18.0`). Treat that commit as the audit anchor, not as a claim that the fork will remain permanently pinned there.

Verify a checkout before doing fork work:

```sh
test "$(git remote get-url origin)" = "https://github.com/performance-clickt/kaneo.git"
test "$(git remote get-url upstream)" = "https://github.com/usekaneo/kaneo.git"
git merge-base --is-ancestor 3fc77f001df9af08257995e11f133a03cce6b6f7 origin/main
```

As a local guardrail, configure the upstream remote as fetch-only. This changes only the checkout's Git configuration and makes an accidental `git push upstream` fail:

```sh
git remote set-url --push upstream DO-NOT-PUSH
```

## Safe upstream synchronization

Upstream changes enter the fork through a dedicated branch and a pull request. Never merge upstream directly into the fork's `main`, force-push either repository, or push upstream tags from the fork.

1. Start with a clean worktree and refresh both authorities.

   ```sh
   git status --short --branch
   git fetch --prune origin main
   git fetch --prune --tags upstream main
   git switch --create john/upstream-sync-vX.Y.Z origin/main
   ```

2. Pin and inspect the exact candidate before merging it. Record the resulting SHA in the pull request; do not rely only on a moving branch name.

   ```sh
   upstream_sha="$(git rev-parse upstream/main)"
   git log --left-right --cherry-pick --oneline origin/main..."$upstream_sha"
   git diff --stat origin/main.."$upstream_sha"
   ```

3. Stage the merge without committing, resolve conflicts deliberately, and inspect the complete result.

   ```sh
   git merge --no-commit --no-ff "$upstream_sha"
   git status --short
   git diff --check
   git diff --cached --stat
   ```

   Do not resolve a conflict set wholesale with `--ours` or `--theirs`. Preserve intentional fork changes, especially this document and the canonical-repository guards in `.github/workflows/`. If the candidate is wrong or the review becomes unclear, use `git merge --abort` and restart from `origin/main`.

4. Run the repository checks represented by CI, plus any checks required by the upstream delta.

   ```sh
   pnpm install --frozen-lockfile
   pnpm exec biome ci .
   pnpm typecheck
   pnpm test
   pnpm test:integration
   pnpm build
   docker build --file Dockerfile.kaneo .
   ```

5. Commit the pinned import, push only to `origin`, and open a pull request into `performance-clickt/kaneo:main`.

   ```sh
   git commit -m "chore: sync usekaneo/kaneo vX.Y.Z"
   git push --set-upstream origin john/upstream-sync-vX.Y.Z
   ```

The pull request must identify the upstream SHA or tag, summarize conflicts and fork-specific resolutions, list verification, and call out migration, security, environment, package, deployment, and workflow changes. Merge only after review and explicit approval.

## Branches and pull requests

- Create work branches from current `origin/main`; use `john/kr-<number>-<slug>` for Kaneo work and `john/upstream-sync-v<version>` for upstream imports.
- Target fork work at `performance-clickt/kaneo:main`. Do not commit directly to `main`.
- Keep a pull request scoped to one Kaneo task. Include the task ID, user-visible behavior, exact verification, and any deferred or gated work.
- Keep fork-only product changes out of upstream-sync commits. If a change should be contributed upstream, prepare it on a clean branch based on `upstream/main` and use the upstream contribution process; do not include private fork customizations.
- Do not push to `upstream`, force-push shared branches, or push tags as part of routine feature and synchronization work.

## CI and release boundaries

`.github/workflows/ci.yml` is fork-safe and intentionally runs on every branch push, every pull request, and manual dispatch. Helm validation remains available on chart pull requests, and the nightly verification job remains read-only. Those workflows may build and test artifacts but do not publish them.

The inherited upstream automations that mutate repository state or contact external systems are guarded with `github.repository == 'usekaneo/kaneo'`. In `performance-clickt/kaneo`, they must skip:

- Dependabot auto-merge, issue assignment, contributor commits, and follow-on site deployment;
- GitHub Pages deployment, Docker and nightly image publishing, and Helm chart publishing;
- npm, MCP Registry, tag, and GitHub Release publishing;
- release orchestration and Discord issue or release notifications.

The fork therefore has no production release pipeline by default. Local builds and CI artifacts are allowed; publishing a fork release is a separate, reviewed body of work. Before enabling one, define fork-owned package namespaces and registry paths, fork-owned credentials and environments, non-colliding tag/version policy, artifact provenance, rollback ownership, and an explicit `performance-clickt/kaneo` workflow guard. Never reuse the upstream `@kaneo` package publishing identity, upstream MCP Registry identity, upstream release tokens, upstream GitHub Pages environment, or upstream notification webhooks.

Changes to workflow guards or release boundaries require the same pull-request review as application code. An upstream sync must re-check every workflow before merge because a newly added upstream workflow is not protected automatically.
