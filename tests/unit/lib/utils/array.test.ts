import { describe, it, expect } from "vitest";
import { unique, uniqueBy, groupBy, sortBy, chunk, shuffle } from "@/lib/utils/array";

describe("Array Utils", () => {
  describe("unique", () => {
    it("removes duplicate primitives", () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it("removes duplicate strings", () => {
      expect(unique(["a", "b", "b", "c"])).toEqual(["a", "b", "c"]);
    });

    it("handles empty array", () => {
      expect(unique([])).toEqual([]);
    });

    it("handles array with no duplicates", () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe("uniqueBy", () => {
    it("removes duplicates by key", () => {
      const items = [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 1, name: "c" },
      ];
      expect(uniqueBy(items, "id")).toEqual([
        { id: 1, name: "a" },
        { id: 2, name: "b" },
      ]);
    });

    it("keeps first occurrence", () => {
      const items = [
        { id: 1, name: "first" },
        { id: 1, name: "second" },
      ];
      expect(uniqueBy(items, "id")[0].name).toBe("first");
    });
  });

  describe("groupBy", () => {
    it("groups items by key", () => {
      const items = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
      ];
      const result = groupBy(items, "type");
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });

    it("handles empty array", () => {
      expect(groupBy([], "key")).toEqual({});
    });
  });

  describe("sortBy", () => {
    const items = [
      { name: "c", age: 30 },
      { name: "a", age: 20 },
      { name: "b", age: 25 },
    ];

    it("sorts ascending by default", () => {
      const result = sortBy(items, "name");
      expect(result[0].name).toBe("a");
      expect(result[2].name).toBe("c");
    });

    it("sorts descending when specified", () => {
      const result = sortBy(items, "age", "desc");
      expect(result[0].age).toBe(30);
      expect(result[2].age).toBe(20);
    });

    it("does not mutate original array", () => {
      const original = [...items];
      sortBy(items, "name");
      expect(items).toEqual(original);
    });
  });

  describe("chunk", () => {
    it("splits array into chunks", () => {
      const result = chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("handles exact division", () => {
      const result = chunk([1, 2, 3, 4], 2);
      expect(result).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("handles empty array", () => {
      expect(chunk([], 2)).toEqual([]);
    });

    it("handles chunk size larger than array", () => {
      const result = chunk([1, 2], 5);
      expect(result).toEqual([[1, 2]]);
    });
  });

  describe("shuffle", () => {
    it("returns array of same length", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffle(arr)).toHaveLength(5);
    });

    it("contains same elements", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it("does not mutate original array", () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffle(arr);
      expect(arr).toEqual(original);
    });
  });
});
