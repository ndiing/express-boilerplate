const { template, stringify } = require("../module.js");

function space(str, indent = 1) {
    return str.replace(/^(?![\{\[])/gm, " ".repeat(4 * indent));
}

function comment(str, isDuplicate) {
    const tabSpace = " ".repeat(4);
    return str.replace(/^ {4}/gm, isDuplicate ? tabSpace + "// " : tabSpace);
}

function transformBaseHeaders(headers) {
    if (headers == null || !Object.keys(headers).length) return;
    return space(JSON.stringify(headers, null, 4));
}

function transformParams(params) {
    if (params == null || !Object.keys(params).length) return;
    return space(stringify(params, "req?.params"), 3);
}
function transformQuery(query) {
    if (query == null || !Object.keys(query).length) return;
    return space(stringify(query, "req?.query"), 3);
}
function transformMethod(method) {
    if (method === "GET") return;
    return method;
}
function transformHeaders(headers) {
    if (headers == null || !Object.keys(headers).length) return;
    return space(JSON.stringify(headers, null, 4), 3);
}
function transformBody(mimeType, body) {
    if (body == null || !Object.keys(body).length) return;
    const str = space(stringify(body, "req?.body"), 3);
    if (mimeType === "application/json") {
        return `JSON.stringify(${str})`;
    } else if (mimeType === "application/x-www-form-urlencoded") {
        return `new URLSearchParams(${str}).toString()`;
    } else if (mimeType === "multipart/form-data") {
        return `formData`;
    }
}

function transformBodyFormData(mimeType, body) {
    if (body == null || !Object.keys(body).length) return;
    if (mimeType === "multipart/form-data") {
        return template`
        const formData = new FormData();
        ${body
            .map(
                ([name, value]) => `
        formData.append("${name}", req?.body?.${name}); // ${JSON.stringify(value)}`,
            )
            .join("")}
        `;
    }
}

/**@param {import("../module").ParseResult} parsed*/
module.exports = (parsed) => /* prettier-ignore */ template`const BaseClient = require("../../core/client.js");

class Client extends BaseClient {
${template`    baseURL = "${parsed.baseURL}";
`}${template`    headers = ${transformBaseHeaders(parsed.headers)};
`}${template`
${parsed.requests?.map(req=>comment(`    /**@param {import("express").Request} req */
    async ${req.methodName}(req) {
        const resource = "${req.pathname}";
        ${template`${transformBodyFormData(req.mimeType,req.body)}
        `}/**@type {import("@ndiinginc/fetch").Options}*/
        const options = {
        ${template`    params: ${transformParams(req.params)},
        `}${template`    query: ${transformQuery(req.query)},
        `}${template`    method: "${transformMethod(req.method)}",
        `}${template`    headers: ${transformHeaders(req.headers)},
        `}${template`    body: ${transformBody(req.mimeType,req.body)},
        `}};
        const response = await this.fetch(resource, options);
        const json = await response.json();
        return json;
    }`,req.isDuplicate)).join('\n\n')}`}
}

module.exports = Client;`;
