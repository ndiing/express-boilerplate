const repository = require("../src/modules/example/repository.js");

describe("example", () => {
    test("repository getAll", async () => {
        const result = await repository.getAll();
        expect(!!result.meta).toBe(true);
    });
});
