# Continuous integration

The [SourcePi AI CI workflow](.github/workflows/ci.yml) runs on pull requests,
pushes to `main`, and manual dispatch from GitHub's Actions tab. It uses
GitHub-hosted Ubuntu 24.04 runners. No repository secrets or self-hosted runners
are required. Actions are pinned to release commit SHAs.

| Check | What runs |
| --- | --- |
| Workflow validation | Actionlint validates active workflows, expressions and embedded shell; ShellCheck checks the CI shell scripts. |
| Frontend / format | `npm run format:check` |
| Frontend / lint | `npm run lint` |
| Frontend / types | `npm run type-check` |
| Frontend / tests | The full Jest suite in CI mode, with coverage and the existing coverage threshold. |
| Frontend / build | `npm run build` and a downloadable production frontend artifact. |
| Go formatting and native version consistency | All tracked Go files pass `gofmt`; `build.sh --check-ort-version` verifies native version declarations. |
| Go build, unit tests and startup checks | Go module verification, `build.sh --all`, help-command startup checks for API/admin/ingestor/syncer and CLI, then `build.sh --test` with race detection, vet and coverage. |
| Docker Compose configuration | Resolve and validate the local deployment using checked-in example environment files, without reading real credentials or starting services. |
| CI | Requires every job above to succeed. |

Frontend checks run independently so a type error does not prevent the build,
lint or test job from reporting its own result. Failures are blocking: no checks
are marked `continue-on-error`, and no packages or failing tests are excluded.
Existing formatting, type or test failures must be fixed before the aggregate
`CI` check can turn green.

## Go dependencies

The Go version comes from `go.mod`; the frontend uses Node.js 24. The native
setup installs Clang/LLD 20 and checksum-verified CMake 4.4.5. The workflow verifies
the selected linker and executes the built binaries to detect startup failures
that a successful link cannot catch.

The repository's existing `tools/scripts/download_dev_deps.py` prepares the Go
native libraries, DeepDoc resources and tokenizer assets through `uv`. This is a
build preparation step; Python application services and Python tests are not run.
Native dependencies and resources are cached by OS, architecture and dependency
declarations. Go and npm use their lockfile-aware caches as well.

The default Go unit tier needs no live external services. Integration and E2E
tests require their documented real services and credentials and are not part of
this workflow. Run those through `build.sh --test-integration` and
`build.sh --test-e2e` in a provisioned environment. The `manual` tier remains
local-only and is never selected by CI.

## Artifacts and branch protection

Successful builds upload `frontend-dist` and `linux-amd64-binaries`; coverage
reports upload when available as `frontend-coverage` and `go-coverage`. Retention
is seven days. The workflow builds and checks the code; it does not publish a
container or deploy the application.

After pushing the workflow and allowing its first run, configure the repository's
branch protection or ruleset to require the check named **CI** before merging.
Workflow files cannot enforce branch protection by themselves.

## Local workflow validation

```bash
bash .github/scripts/check-workflows.sh
bash -n .github/scripts/*.sh
```

The validation script downloads a pinned, checksum-verified Actionlint binary on
Linux x64 or Apple Silicon. If ShellCheck is installed, Actionlint also checks
embedded shell locally. The Linux CI job explicitly requires ShellCheck.

Use the existing frontend commands and `build.sh` to reproduce individual jobs;
do not run the runner-provisioning script on a development machine.
