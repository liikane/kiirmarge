import assert from "node:assert/strict";
import { test } from "node:test";

import { dequeue, enqueue, isQueued, newQueuedIssue, QUEUE_LIMIT } from "./queue.ts";

const INPUT = {
  repo: "liikane/kiirmarge",
  title: "Pealkiri",
  body: "Kirjeldus",
  label: "bug" as const,
  noteDir: "C:\\Notes",
  noteFile: "2026-10-25-210500.md",
  createdAt: "2026-10-25T21:05:00.000Z",
};

test("uus kirje kannab kõiki välju ja alustab nullkatsetest", () => {
  const item = newQueuedIssue(INPUT, "a1");
  assert.deepEqual(item, { ...INPUT, id: "a1", attempts: 0 });
});

test("enqueue lisab lõppu ja ei korda sama id-d", () => {
  const first = newQueuedIssue(INPUT, "a1");
  const second = newQueuedIssue({ ...INPUT, title: "Teine" }, "a2");
  const queue = enqueue(enqueue([], first), second);
  assert.deepEqual(
    queue.map((item) => item.id),
    ["a1", "a2"],
  );

  const again = enqueue(queue, first);
  assert.deepEqual(
    again.map((item) => item.id),
    ["a2", "a1"],
  );
  assert.equal(again.length, 2);
});

test("ülempiiri ületamisel jäävad vanimad välja", () => {
  let queue: ReturnType<typeof newQueuedIssue>[] = [];
  for (let index = 0; index < QUEUE_LIMIT + 3; index += 1) {
    queue = enqueue(queue, newQueuedIssue({ ...INPUT, title: `#${index}` }, `id-${index}`));
  }
  assert.equal(queue.length, QUEUE_LIMIT);
  assert.equal(queue[0]?.id, "id-3");
  assert.equal(queue[queue.length - 1]?.id, `id-${QUEUE_LIMIT + 2}`);
});

test("dequeue eemaldab ainult etteantud kirje", () => {
  const first = newQueuedIssue(INPUT, "a1");
  const second = newQueuedIssue({ ...INPUT, title: "Teine" }, "a2");
  const queue = [first, second];
  assert.deepEqual(
    dequeue(queue, "a1").map((item) => item.id),
    ["a2"],
  );
  assert.equal(isQueued(queue, "a2"), true);
  assert.equal(isQueued(queue, "puudub"), false);
});
