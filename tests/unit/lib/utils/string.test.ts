import { describe, it, expect } from "vitest";
import {
  capitalize,
  capitalizeWords,
  slugify,
  camelCase,
  snakeCase,
  kebabCase,
  pluralize,
  randomString,
} from "@/lib/utils/string";

describe("String Utils", () => {
  describe("capitalize", () => {
    it("capitalizes first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("lowercases rest of string", () => {
      expect(capitalize("HELLO")).toBe("Hello");
    });

    it("handles single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("handles empty string", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("capitalizeWords", () => {
    it("capitalizes each word", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");
    });

    it("handles multiple spaces", () => {
      expect(capitalizeWords("hello  world")).toBe("Hello  World");
    });

    it("handles single word", () => {
      expect(capitalizeWords("hello")).toBe("Hello");
    });
  });

  describe("slugify", () => {
    it("converts to lowercase with hyphens", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(slugify("Hello! World?")).toBe("hello-world");
    });

    it("handles multiple spaces", () => {
      expect(slugify("hello   world")).toBe("hello-world");
    });

    it("trims hyphens from edges", () => {
      expect(slugify("  hello world  ")).toBe("hello-world");
    });

    it("handles underscores", () => {
      expect(slugify("hello_world")).toBe("hello-world");
    });
  });

  describe("camelCase", () => {
    it("converts space-separated to camelCase", () => {
      expect(camelCase("hello world")).toBe("helloWorld");
    });

    it("converts hyphen-separated to camelCase", () => {
      expect(camelCase("hello-world")).toBe("helloWorld");
    });

    it("converts underscore-separated to camelCase", () => {
      expect(camelCase("hello_world")).toBe("helloWorld");
    });

    it("handles mixed separators", () => {
      expect(camelCase("hello-world_test")).toBe("helloWorldTest");
    });
  });

  describe("snakeCase", () => {
    it("converts camelCase to snake_case", () => {
      expect(snakeCase("helloWorld")).toBe("hello_world");
    });

    it("converts space-separated to snake_case", () => {
      expect(snakeCase("hello world")).toBe("hello_world");
    });

    it("handles already snake_case", () => {
      expect(snakeCase("hello_world")).toBe("hello_world");
    });
  });

  describe("kebabCase", () => {
    it("converts camelCase to kebab-case", () => {
      expect(kebabCase("helloWorld")).toBe("hello-world");
    });

    it("converts space-separated to kebab-case", () => {
      expect(kebabCase("hello world")).toBe("hello-world");
    });

    it("handles already kebab-case", () => {
      expect(kebabCase("hello-world")).toBe("hello-world");
    });
  });

  describe("pluralize", () => {
    it("returns singular for count of 1", () => {
      expect(pluralize(1, "item")).toBe("item");
    });

    it("returns default plural for count > 1", () => {
      expect(pluralize(2, "item")).toBe("items");
    });

    it("returns custom plural when provided", () => {
      expect(pluralize(2, "person", "people")).toBe("people");
    });

    it("returns plural for count of 0", () => {
      expect(pluralize(0, "item")).toBe("items");
    });
  });

  describe("randomString", () => {
    it("generates string of correct length", () => {
      expect(randomString(10)).toHaveLength(10);
    });

    it("generates different strings", () => {
      const str1 = randomString(20);
      const str2 = randomString(20);
      expect(str1).not.toBe(str2);
    });

    it("only contains alphanumeric characters", () => {
      const str = randomString(50);
      expect(str).toMatch(/^[A-Za-z0-9]+$/);
    });
  });
});
