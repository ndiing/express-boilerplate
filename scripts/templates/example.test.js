/**@param {import("../module").ParseResult} parsed*/
module.exports = (parsed) => /* prettier-ignore */ `const repository = require("../src/modules/${parsed.name}/repository.js");

describe("${parsed.name}", () => {
    test("test", async () => {
    });
});
`;
