import { join } from "path";
import { promisify } from "util";
import { equal, ok } from "assert";
import * as MemoryFs from "memory-fs";
import * as lasso2 from "lasso2";
import * as lasso3 from "lasso3";
import plugin from "../src";

const fs = new MemoryFs();
const FIXTURES = join(__dirname, "fixtures");
const LASSO_CONFIG = {
  plugins: [
    {
      plugin,
      config: { fileSystem: fs }
    }
  ]
};
const PAGE_CONFIG = {
  name: "test",
  from: FIXTURES,
  dependencies: ["./logo.png", "./example.css", "require-run: ./example.js"]
};

lasso3.configure(LASSO_CONFIG);
lasso2.configure(LASSO_CONFIG);

describe("Plugin", () => {
  afterEach(() => (fs.data = {}));

  it("should work in lasso 3", async () => {
    const result = await lasso3.lassoPage(PAGE_CONFIG);

    const outputFiles = result.getOutputFiles();
    equal(outputFiles.length, 2, "Should have two bundles written to disk");

    ok(
      fs.readFileSync(join(__dirname, "..", "/static/test/fixtures/logo.png")),
      "should have written resource to disk"
    );

    for (const file of outputFiles) {
      const filePath = join(__dirname, "..", file);
      ok(fs.readFileSync(filePath));
    }
  });

  it("should work in lasso 2", async () => {
    const result = await (promisify(lasso2.lassoPage) as any)(PAGE_CONFIG);

    const outputFiles = result.getOutputFiles();
    equal(outputFiles.length, 2, "Should have two bundles written to disk");

    ok(
      fs.readFileSync(join(__dirname, "..", "/static/test/fixtures/logo.png")),
      "should have written resource to disk"
    );

    for (const file of outputFiles) {
      const filePath = join(__dirname, "..", file);
      ok(fs.readFileSync(filePath));
    }
  });
});
