import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { REVIEW_PEOPLE } from "../src/review-people.mjs";

const root = new URL("../", import.meta.url);

test("friends have stable identities independent of their seat in a hand", () => {
  assert.deepEqual(Object.keys(REVIEW_PEOPLE), ["tengteng", "kelin", "xingxing", "juyipeng", "minmin", "wangwang", "jianjian"]);
  assert.deepEqual(Object.values(REVIEW_PEOPLE).map(({ id, name, gender }) => ({ id, name, gender })), [
    { id: "tengteng", name: "腾腾", gender: "male" },
    { id: "kelin", name: "克林", gender: "male" },
    { id: "xingxing", name: "星星", gender: "male" },
    { id: "juyipeng", name: "掬一捧", gender: "male" },
    { id: "minmin", name: "敏敏", gender: "female" },
    { id: "wangwang", name: "旺旺", gender: "male" },
    { id: "jianjian", name: "尖尖", gender: "male" },
  ]);
});

test("each friend has a distinct local image asset with a matching image signature", async () => {
  const portraits = Object.values(REVIEW_PEOPLE).map(({ avatar }) => avatar);
  assert.equal(new Set(portraits).size, 7);
  for (const avatar of portraits) {
    assert.match(avatar, /^src\/assets\/avatars\/[a-z-]+\.(?:png|jpg)$/);
    const image = await readFile(new URL(avatar, root));
    assert.ok(image.length > 1024, `${avatar} must contain the actual portrait`);
    assert.deepEqual(
      [...image.subarray(0, avatar.endsWith(".png") ? 8 : 3)],
      avatar.endsWith(".png") ? [137, 80, 78, 71, 13, 10, 26, 10] : [255, 216, 255],
      `${avatar} must use its declared format`,
    );
  }
});

test("GitHub avatar is the unchanged image snapshot with its original profile attribution", async () => {
  const { avatar, avatarSource } = REVIEW_PEOPLE.juyipeng;
  assert.equal(avatarSource.type, "github");
  assert.equal(avatarSource.profileUrl, "https://github.com/solome");
  assert.equal(avatarSource.imageUrl, "https://avatars.githubusercontent.com/u/2769724?v=4&s=512");
  const image = await readFile(new URL(avatar, root));
  assert.equal(createHash("sha256").update(image).digest("hex"), avatarSource.sha256);
});

test("playing traits are reserved without inventing descriptions", () => {
  for (const person of Object.values(REVIEW_PEOPLE)) assert.deepEqual(person.traits, []);
});
