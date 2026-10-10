import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/config/env";

describe("parseEnv", () => {
  it("applies defaults", () => {
    expect(parseEnv({})).toEqual({
      MONGODB_URI: "mongodb://127.0.0.1:27017",
      MONGODB_DB: "carousel_studio",
      OUTPUT_DIR: "./output",
      DATA_DIR: "./data",
      CONTENT_DIR: "./content",
    });
  });

  it("reports invalid variable names without leaking values", () => {
    expect(() => parseEnv({ MONGODB_DB: "bad name; drop" })).toThrow(/MONGODB_DB/);
    expect(() => parseEnv({ MONGODB_DB: "bad name; drop" })).not.toThrow(/drop/);
  });
});
