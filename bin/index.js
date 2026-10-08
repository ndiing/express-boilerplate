#!/usr/bin/env node

const path = require("path");
const modulee = require("../scripts/module.js");
const review = require("../scripts/review.js");

function parseParams(arr) {
    const params = {};
    for (const arg of arr) {
        const [, name, , value = true] = arg.match(/--([^=]+)(=([^ ]+))?/);
        const key = name.replace(/[^a-zA-Z0-9]+([a-zA-Z])/g, (_, char) => char.toUpperCase());
        params[key] = value;
    }
    return params;
}

// const argv = `C:\\nvm4w\\nodejs\\node.exe C:\\Users\\ndiin\\Documents\\ndiing\\2020\\express-boilerplate\\bin\\index.js generate review --name=example --har=fixtures/jsonplaceholder.har --dry-run --force`.split(" ");
// const [, , action, method, ...arr] = argv;
const [, , action, method, ...arr] = process.argv;
const params = parseParams(arr);

const cli = {
    review: {
        generate: async (params = {}) => {
            await review.generate({
                //
                dir: path.resolve(),
                excludes: [
                    // RegExp
                    /\.git/,
                    /\.npmignore/,
                    /README\.md/,
                    /LICENSE/,
                    /node_modules/,
                    /\.env/,
                    /\.prettierrc/,
                    /bin/,
                    /.*\.db/,
                    /fixtures/,
                    // /migrations/,
                    /nodemon\.json/,
                    /package(-lock)?.json/,
                    /rest/,
                    /scripts\\review\.js/,
                    /dist/,
                    /out/,
                    /temp\//,
                    // /tests/,
                ],
                includes: [
                    //RegExp
                    /scripts/,
                    /scripts\\templates/,
                ],
                ...params,
            });
        },
        remove: () => {
            review.remove();
        },
    },
    module: {
        generate: async (params = {}) => {
            await modulee.generate({
                //
                name: "jsonplaceholder",
                input: path.resolve("fixtures", "jsonplaceholder.har"),
                excludeHeaders: [
                    // RegExp
                    /^host/i,
                    /^connection/i,
                    /^pragma/i,
                    /^cache-control/i,
                    /^sec-/i,
                    /^accept/i,
                    /^origin/i,
                    /^referer/i,
                    /^cookie/i,
                    /^Content-Length/i,
                ],
                urlPatterns: [
                    // URLPattern
                    new URLPattern("https://jsonplaceholder.typicode.com/posts/:id/comments"),
                    new URLPattern("https://jsonplaceholder.typicode.com/posts/:id"),
                ],
                ...params,
            });
        },
        remove: (params) => {
            modulee.remove({
                name: params.name,
            });
        },
    },
};

cli?.[method]?.[action]?.(params);
