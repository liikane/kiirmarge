// Kasutusjuht: märkmest GitHubi Issue. Võrk käib läbi `IssueClient` pordi,
// seega see fail jääb platvormist sõltumatuks ja testitavaks.

import type { IssueLabel, KiirmargeConfig } from "../config/types.ts";
import { repoError } from "../config/validate.ts";
import { composeIssueDraft, type IssueDraft } from "../github/compose.ts";
import type { QueuedIssue } from "../github/queue.ts";

export interface IssueCreated {
  number: number;
  url: string;
}

export interface CreateIssueInput {
  repo: string;
  title: string;
  body: string;
  label: IssueLabel;
}

/** Võrguadapter (Tauri-kest teostab selle `invoke`-iga). */
export interface IssueClient {
  create(input: CreateIssueInput): Promise<IssueCreated>;
}

export interface IssueFailure {
  message: string;
  /** `true` = tasub hiljem uuesti proovida (võrk, 5xx, rate limit); `false` = viga ei parane ise. */
  retryable: boolean;
}

export type CreateIssueResult =
  | { ok: true; issue: IssueCreated; draft: IssueDraft }
  | { ok: false; failure: IssueFailure; draft: IssueDraft | null };

export type QueuedSendResult =
  | { ok: true; issue: IssueCreated }
  | { ok: false; failure: IssueFailure };

/**
 * Adapteri visatud vea normaliseerimine. Tundmatu viga loetakse korduvatavaks —
 * parem hoida järjekorras kui kaotada märge.
 */
export function issueFailureOf(error: unknown): IssueFailure {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; retryable?: unknown };
    if (typeof candidate.message === "string") {
      // Kui adapter ei ütle korratavust, eeldame ettevaatlikult, et tasub proovida uuesti.
      const retryable = candidate.retryable === undefined ? true : candidate.retryable === true;
      return { message: candidate.message, retryable };
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  return { message, retryable: true };
}

/**
 * Märkme tekst -> Issue. Kontrollib seadistuse enne võrku minekut; tagastab ka mustandi,
 * et kutsuja saaks nurjumise korral selle järjekorda panna.
 */
export async function createIssueFromNote(
  text: string,
  options: {
    config: KiirmargeConfig;
    filename: string;
    stamp: string;
    client: IssueClient;
  },
): Promise<CreateIssueResult> {
  const github = options.config.github;
  const draft = composeIssueDraft(text, { filename: options.filename, stamp: options.stamp });
  if (draft === null) {
    return {
      ok: false,
      failure: { message: "Märge on tühi — Issue't ei loodud.", retryable: false },
      draft: null,
    };
  }
  if (!github.enabled) {
    return {
      ok: false,
      failure: { message: "GitHubi Issue saatmine on seadetes välja lülitatud.", retryable: false },
      draft,
    };
  }
  const repoProblem = repoError(github.repo);
  if (repoProblem !== null) {
    return { ok: false, failure: { message: repoProblem, retryable: false }, draft };
  }

  try {
    const issue = await options.client.create({
      repo: github.repo.trim(),
      title: draft.title,
      body: draft.body,
      label: github.label,
    });
    return { ok: true, issue, draft };
  } catch (error) {
    return { ok: false, failure: issueFailureOf(error), draft };
  }
}

/** Järjekorras oleva Issue'i uuesti saatmine (kasutatakse käivitamisel). */
export async function sendQueuedIssue(
  item: QueuedIssue,
  client: IssueClient,
): Promise<QueuedSendResult> {
  try {
    const issue = await client.create({
      repo: item.repo,
      title: item.title,
      body: item.body,
      label: item.label,
    });
    return { ok: true, issue };
  } catch (error) {
    return { ok: false, failure: issueFailureOf(error) };
  }
}
