import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../../.github/workflows/clickt-image.yml",
  import.meta.url,
);
const dockerfilePath = new URL("../../Dockerfile.kaneo", import.meta.url);
const forkGuidePath = new URL("../../HIVEMIND_FORK.md", import.meta.url);
const upstreamPublisherPaths = [
  "auto-assign.yml",
  "auto-merge.yml",
  "deploy-site.yml",
  "docker.yml",
  "helm-chart.yml",
  "issue-notify.yml",
  "nightly.yml",
  "publish-mcp.yml",
  "publish-planka-import.yml",
  "release-notify.yml",
  "release.yml",
  "update-contributors.yml",
].map((name) => new URL(`../../.github/workflows/${name}`, import.meta.url));

const [workflow, dockerfile, forkGuide, ...upstreamPublishers] =
  await Promise.all([
    readFile(workflowPath, "utf8"),
    readFile(dockerfilePath, "utf8"),
    readFile(forkGuidePath, "utf8"),
    ...upstreamPublisherPaths.map((path) => readFile(path, "utf8")),
  ]);

test("Clickt publishing is isolated, manually dispatched, and least privilege", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(
    workflow,
    /github\.repository == 'performance-clickt\/kaneo'.*github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(workflow, /permissions:\n\s+contents: read\n\s+packages: write/);
  assert.match(workflow, /password: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.doesNotMatch(workflow, /GH_PACKAGE_TOKEN|RELEASE_TOKEN|latest/);
});

test("the only published tag is immutable and multi-architecture", () => {
  assert.match(
    workflow,
    /image_version="v\$\{UPSTREAM_VERSION\}-clickt\.\$\{short_reskin\}\.\$\{short_source\}"/,
  );
  assert.match(workflow, /platforms: linux\/amd64,linux\/arm64/);
  assert.match(
    workflow,
    /tags: \$\{\{ steps\.version\.outputs\.image_ref \}\}/,
  );
  assert.match(workflow, /Refuse to overwrite an existing immutable tag/);
  assert.match(workflow, /immutableRef:/);
});

test("published images carry source, revision, version, license and fork provenance", () => {
  for (const label of [
    "org.opencontainers.image.source",
    "org.opencontainers.image.revision",
    "org.opencontainers.image.version",
    "org.opencontainers.image.licenses",
    "io.clickt.kaneo.upstream-version",
    "io.clickt.kaneo.reskin-revision",
  ]) {
    assert.match(dockerfile, new RegExp(label.replaceAll(".", "\\.")));
    assert.match(workflow, new RegExp(label.replaceAll(".", "\\.")));
  }
});

test("fork documentation keeps upstream publishers disabled", () => {
  assert.match(forkGuide, /\.github\/workflows\/clickt-image\.yml/);
  assert.match(forkGuide, /\.github\/workflows\/docker\.yml/);
  assert.match(forkGuide, /remain guarded to `usekaneo\/kaneo`/);

  for (const [index, upstreamWorkflow] of upstreamPublishers.entries()) {
    assert.match(
      upstreamWorkflow,
      /github\.repository == 'usekaneo\/kaneo'/,
      `${upstreamPublisherPaths[index].pathname} lost its canonical repository guard`,
    );
  }
});
