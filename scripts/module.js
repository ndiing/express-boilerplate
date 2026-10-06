const fs = require("fs");
const path = require("path");
const { inspect, styleText } = require("util");

/**
 * @typedef ParseOptions
 * @property {RegExp[]} excludeHeaders
 * @property {URLPattern[]} URLPatterns
 */

/**
 * @typedef {{name: string;baseURL: any;headers: {};requests: {method: string;baseURL: string;pathname: string;params: {};query: {};mimeType: string;body: any;methodName: string;isDuplicate: boolean;}[];params: [any, any][];}} ParseResult
 */

/**
 * @param {import("fs").PathLike} input
 * @param {ParseOptions} options
 * @returns {Promise<ParseResult>}
 */
async function parse(input, { excludeHeaders = [], URLPatterns = [] } = {}) {
    const parsed = path.parse(input);
    const output = path.join(parsed.dir, parsed.name + ".json");
    fs.writeFileSync(output, fs.readFileSync(input));
    /**@type {import('har-format').Har}*/
    const har = require(output);
    fs.unlinkSync(output);

    const _baseURL = new Set();
    const _headers = new Map();
    const _methodName = new Set();
    const _params = new Map();
    const _requests = [];
    for (const entry of har.log.entries) {
        const method = entry.request.method;

        const url = new URL(entry.request.url);
        const baseURL = url.origin;
        _baseURL.add(baseURL);
        let pathname = url.pathname;
        let params = {};

        for (const pattern of URLPatterns) {
            const match = pattern.exec(url);
            if (match) {
                pathname = pattern.pathname;
                params = match.pathname.groups;
                break;
            }
        }

        for (const name in params) {
            _params.set(name, params[name]);
        }

        const methodName = (method.toLowerCase() + pathname).replace(/[^a-zA-Z0-9]+([a-zA-Z])/g, (_, char) => char.toUpperCase());
        const isDuplicate = _methodName.has(methodName);
        _methodName.add(methodName);

        const query = {};
        for (const { name, value } of entry.request.queryString) {
            if (query[name]) {
                if (Array.isArray(query[name])) {
                    query[name].push(value);
                } else {
                    query[name] = [query[name], value];
                }
            } else {
                query[name] = value;
            }
        }

        const headers = {};
        for (const { name, value } of entry.request.headers) {
            if (excludeHeaders.some((regex) => regex.test(name))) continue;

            headers[name] = value;

            const key = name.toLowerCase();
            if (_headers.has(key)) {
                _headers.get(key).add(value);
            } else {
                _headers.set(key, new Set([value]));
            }
        }

        const mimeType = entry.request.postData.mimeType;

        let body;
        if (mimeType === "application/json") {
            body = JSON.parse(entry.request.postData.text);
        } else if (mimeType === "application/x-www-form-urlencoded") {
            body = entry.request.postData.params.map(({ name, value }) => [name, value]);
        } else if (mimeType === "multipart/form-data") {
            const res = new Response(entry.request.postData.text, { headers });
            const formData = await res.formData();
            body = Array.from(formData);
        }

        _requests.push({
            method,
            baseURL,
            pathname,
            params,
            query,
            headers,
            mimeType,
            body,
            methodName,
            isDuplicate,
        });
    }

    const baseURL = _baseURL.size > 1 ? null : _baseURL.values().next().value;

    const headers = {};
    for (const [name, value] of _headers) {
        if (value.size > 1) continue;
        headers[name] = value.values().next().value;
    }

    const requests = [];
    for (const _request of _requests) {
        const { headers, ...request } = _request;
        const deltaHeaders = {};
        for (const name in headers) {
            const key = name.toLowerCase();
            if (_headers.get(key).size === 1) continue;
            deltaHeaders[name] = headers[name];
        }
        request.headers = deltaHeaders;
        requests.push(request);
    }

    const params = Array.from(_params);

    return {
        baseURL,
        headers,
        requests,
        params,
    };
}
module.exports.parse = parse;

/**
 * @param {Object|Array} obj
 * @param {String} [prefix="req?.body"]
 * @param {Number} [indent=0]
 * @returns {String}
 */
function stringify(obj, prefix = "req?.body", indent = 0) {
    const spaces = " ".repeat(indent * 4);
    const nextSpaces = " ".repeat((indent + 1) * 4);

    if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";
        const items = obj.map((item, index) => {
            const newPrefix = `${prefix}?.[${index}]`;
            if (typeof item === "object" && item !== null) {
                return stringify(item, newPrefix, indent + 1);
            }
            return `${newPrefix}, // ${JSON.stringify(item)}`;
        });
        return `[\n${nextSpaces}${items.join(`,\n${nextSpaces}`)}\n${spaces}]`;
    }

    if (typeof obj === "object" && obj !== null) {
        const entries = Object.entries(obj);
        if (entries.length === 0) return "{}";

        const parts = entries.map(([key, value]) => {
            const newPrefix = `${prefix}?.${key}`;
            if (typeof value === "object" && value !== null) {
                const valStr = stringify(value, newPrefix, indent + 1);
                return `${nextSpaces}"${key}": ${valStr}`;
            }
            const displayValue = value === undefined ? "undefined" : JSON.stringify(value);
            return `${nextSpaces}"${key}": ${newPrefix}, // ${displayValue}`;
        });
        return `{\n${parts.join(",\n")}\n${spaces}}`;
    }

    return JSON.stringify(obj);
}
module.exports.stringify = stringify;

function template(strings, ...values) {
    return strings.reduce((result, string, index) => {
        let value = values[index - 1];

        if (Array.isArray(value)) value = value.join("\n");
        if (typeof value === "object") value = JSON.stringify(value);
        if (value == null) return "";

        return result + value + string;
    });
}
module.exports.template = template;

async function generate({ name, input, excludeHeaders = [], URLPatterns = [] } = {}) {
    const templatesDir = path.resolve("scripts", "templates");
    const modulesDir = path.resolve("src", "modules");
    const testsDir = path.resolve("tests");
    const restDir = path.resolve("rest");

    try {
        const parsed = await parse(input, { excludeHeaders, URLPatterns });
        
        const resources = [
            ["index.js", path.join(modulesDir, name, "index.js")],
            ["controller.js", path.join(modulesDir, name, "controller.js")],
            ["service.js", path.join(modulesDir, name, "service.js")],
            ["session.js", path.join(modulesDir, name, "session.js")],
            ["client.js", path.join(modulesDir, name, "client.js")],
            ["repository.js", path.join(modulesDir, name, "repository.js")],
            ["example.test.js", path.join(testsDir, `${name}.test.js`)],
            ["example.http.js", path.join(restDir, `${name}.http`)],
        ];
        for (const [source, target] of resources) {
            if (fs.existsSync(target)) {
                console.log(styleText(["yellow"], "↶"), styleText(["dim"], target.replace(path.resolve(), "")));
                
                continue;
            }

            const render = require(path.join(templatesDir, source));
            const result = await render({ name, ...parsed });

            const dir = path.dirname(target);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(target, result);

            console.log(styleText(["white"], "↷"), styleText(["dim"], target.replace(path.resolve(), "")));
        }

        console.log(styleText(["green"], "✓"), styleText(["dim"], name));
    } catch (error) {
        console.log(styleText(["red"], "✗"), styleText(["dim"], name));
    }
}
module.exports.generate = generate;
