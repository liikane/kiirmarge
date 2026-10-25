import assert from "node:assert/strict";
import { test } from "node:test";

import { cloneConfig, DEFAULT_CONFIG } from "../config/defaults.ts";
import { newQueuedIssue } from "../github/queue.ts";
import { createIssueFromNote, issueFailureOf, sendQueuedIssue, type IssueClient } from "./create-issue.ts";

function githubConfig(overrides: Partial<ReturnType<typeof cloneConfig>["github"]> = {}) {
  const config = cloneConfig(DEFAULT_CONFIG);
  config.github = { enabled: true, repo: "liikane/kiirmarge", label: "bug", send_by_default: true, ...overrides };
  return config;
}

const OPTIONS = { filename: "2026-10-25-210500.md", stamp: "2026-10-25 21:05" };

test("õnnestunud saatmine annab Issue numbri ja URL-i", async () => {
  let received: unknown = null;
  const client: IssueClient = {
    create: async (input) => {
      received = input;
      return { number: 42, url: "https://github.com/liikane/kiirmarge/issues/42" };
    },
  };

  const result = await createIssueFromNote("Parandada kiirklahv\n\npärast unerežiimi", {
    ...OPTIONS,
    config: githubConfig(),
    client,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.issue, {
    number: 42,
    url: "https://github.com/liikane/kiirmarge/issues/42",
  });
  assert.deepEqual(received, {
    repo: "liikane/kiirmarge",
    title: "Parandada kiirklahv",
    body: result.ok ? result.draft.body : "",
    label: "bug",
  });
});

test("välja lülitatud saatmine ei lähe võrku", async () => {
  let called = false;
  const client: IssueClient = {
    create: async () => {
      called = true;
      return { number: 1, url: "https://example.com" };
    },
  };
  const result = await createIssueFromNote("tekst", {
    ...OPTIONS,
    config: githubConfig({ enabled: false }),
    client,
  });
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.failure.retryable, false);
  assert.match(result.ok === false ? result.failure.message : "", /välja lülitatud/);
  assert.equal(called, false);
});

test("vigane hoidla peatab saatmise enne võrku", async () => {
  const result = await createIssueFromNote("tekst", {
    ...OPTIONS,
    config: githubConfig({ repo: "vale-hoidla" }),
    client: { create: async () => ({ number: 1, url: "" }) },
  });
  assert.equal(result.ok, false);
  assert.match(result.ok === false ? result.failure.message : "", /omanik\/nimi/);
});

test("tühi märge ei anna mustandit ega lähe võrku", async () => {
  const result = await createIssueFromNote("   ", {
    ...OPTIONS,
    config: githubConfig(),
    client: { create: async () => ({ number: 1, url: "" }) },
  });
  assert.equal(result.ok, false);
  assert.equal(result.draft, null);
});

test("adapteri viga säilitab korratavuse lipu ja mustandi", async () => {
  const client: IssueClient = {
    create: async () => {
      throw { message: "Võrku ei saanud — proovi hiljem.", retryable: true };
    },
  };
  const result = await createIssueFromNote("idee", { ...OPTIONS, config: githubConfig(), client });
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.failure.retryable, true);
  assert.equal(result.draft?.title, "idee");
});

test("tundmatut viga loetakse korratavaks", () => {
  assert.deepEqual(issueFailureOf(new Error("katki")), { message: "katki", retryable: true });
  assert.deepEqual(issueFailureOf({ message: "401", retryable: false }), {
    message: "401",
    retryable: false,
  });
});

test("järjekorrast saatmine kasutab kirje enda välju", async () => {
  let received: { repo: string; label: string } | null = null;
  const client: IssueClient = {
    create: async (input) => {
      received = input;
      return { number: 7, url: "https://github.com/o/r/issues/7" };
    },
  };
  const item = newQueuedIssue(
    {
      repo: "o/r",
      title: "Pealkiri",
      body: "Kirjeldus",
      label: "documentation",
      noteDir: "C:\\Notes",
      noteFile: "a.md",
      createdAt: "2026-10-25T21:05:00.000Z",
    },
    "id-1",
  );
  const result = await sendQueuedIssue(item, client);
  assert.equal(result.ok, true);
  assert.deepEqual(received, { repo: "o/r", label: "documentation", title: "Pealkiri", body: "Kirjeldus" });
});
