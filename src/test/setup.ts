import "@testing-library/jest-dom";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

beforeAll(() => {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://sphinx_bounties:bounties_password@localhost:5433/sphinx_bounties";
  process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || "ad2ead85eca29fb29931fdac6bd07ba44789cdba58c19b29ee7556806f26701c";
  process.env.JWT_EXPIRY_HOURS = process.env.JWT_EXPIRY_HOURS || "168";
  process.env.REDIS_URL = process.env.REDIS_URL || "";
  process.env.SUPER_ADMINS = process.env.SUPER_ADMINS || "";
});

afterEach(() => {
  cleanup();
});
