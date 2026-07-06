import { describe, expect, it } from "vitest";

import { kdsSidebarMessages, resolveKdsSendingPost } from "./kds-station-screen";

describe("kdsSidebarMessages", () => {
  const kitchen = {
    id: "kitchen-sala",
    quickComments: ["Έλα Πάσο", "Καθυστέρηση Πιάτου"],
  };
  const bar = {
    id: "bar-sala",
    quickComments: ["Έτοιμο Ποτό", "Αλλαγή Ποτού"],
  };
  const merged = ["Έτοιμο Ποτό", "Έλα Πάσο", "Αλλαγή Ποτού"];

  it("shows only active kitchen post messages (not merged bar)", () => {
    expect(kdsSidebarMessages(kitchen, { allQuickComments: merged })).toEqual([
      "Έλα Πάσο",
      "Καθυστέρηση Πιάτου",
    ]);
  });

  it("shows only active bar post messages", () => {
    expect(kdsSidebarMessages(bar, { allQuickComments: merged })).toEqual([
      "Έτοιμο Ποτό",
      "Αλλαγή Ποτού",
    ]);
  });

  it("falls back to merged list when no post in zone (e.g. empty floor)", () => {
    expect(kdsSidebarMessages(null, { allQuickComments: merged })).toEqual(merged);
  });

  it("falls back to station quickComments when no post and no merge", () => {
    expect(kdsSidebarMessages(null, { quickComments: ["Legacy"] })).toEqual(["Legacy"]);
  });

  it("returns empty when active post has no chips", () => {
    expect(kdsSidebarMessages({ quickComments: [] }, { allQuickComments: merged })).toEqual([]);
  });
});

describe("resolveKdsSendingPost", () => {
  const kitchen = { id: "k", quickComments: ["Έλα Πάσο"] };
  const bar = { id: "b", quickComments: ["Έτοιμο Ποτό"] };
  const posts = [kitchen, bar];

  it("uses chip owner when message matches one post", () => {
    expect(resolveKdsSendingPost("Έτοιμο Ποτό", kitchen, posts)).toBe(bar);
  });

  it("keeps active post when message is ambiguous or custom", () => {
    expect(resolveKdsSendingPost("Custom note", kitchen, posts)).toBe(kitchen);
  });

  it("keeps active post when same chip exists on multiple posts", () => {
    const a = { id: "a", quickComments: ["OK"] };
    const b = { id: "b", quickComments: ["OK"] };
    expect(resolveKdsSendingPost("OK", a, [a, b])).toBe(a);
  });
});
