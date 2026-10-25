// Võrguühenduseta tekkinud Issue'de järjekord. Puhas loogika — faili hoiab kest.

import type { IssueLabel } from "../config/types.ts";

/** Üks ootel Issue: kõik, mida hiljem uuesti saatmiseks vaja. */
export interface QueuedIssue {
  id: string;
  repo: string;
  title: string;
  body: string;
  label: IssueLabel;
  /** Märkme kaust ja fail, kuhu õnnestumisel lisada Issue number ja URL. */
  noteDir: string;
  noteFile: string;
  /** ISO-ajatempel, millal järjekorda pandi. */
  createdAt: string;
  attempts: number;
}

/** Järjekorra ülempiir — vanemad kirjed jäävad välja, et fail ei paisuks. */
export const QUEUE_LIMIT = 20;

export interface QueuedIssueInput {
  repo: string;
  title: string;
  body: string;
  label: IssueLabel;
  noteDir: string;
  noteFile: string;
  createdAt: string;
}

/** Uus järjekorra kirje; `id` antakse ette, et funktsioon jääks deterministlikuks. */
export function newQueuedIssue(input: QueuedIssueInput, id: string): QueuedIssue {
  return { ...input, id, attempts: 0 };
}

/** Lisab kirje lõppu; ülempiiri ületamisel jätab vanimad välja. */
export function enqueue(queue: readonly QueuedIssue[], item: QueuedIssue): QueuedIssue[] {
  const without = queue.filter((entry) => entry.id !== item.id);
  const next = [...without, item];
  return next.length > QUEUE_LIMIT ? next.slice(next.length - QUEUE_LIMIT) : next;
}

/** Eemaldab kirje (nt õnnestunud saatmise järel). */
export function dequeue(queue: readonly QueuedIssue[], id: string): QueuedIssue[] {
  return queue.filter((entry) => entry.id !== id);
}

/** Kas kirje on juba järjekorras. */
export function isQueued(queue: readonly QueuedIssue[], id: string): boolean {
  return queue.some((entry) => entry.id === id);
}
