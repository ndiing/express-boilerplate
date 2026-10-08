const { template } = require("../module.js");
const FormData = require("form-data");

function transformPathname(pathname) {
    return pathname.replace(/:(\w+)/g, "{{$1}}");
}

function transformQuery(query) {
    if (query == null || !Object.keys(query).length) return;
    return ("?" + new URLSearchParams(query).toString()).replace(/&/g, "\n&");
}

function transformHeaders(headers) {
    if (headers == null || !Object.keys(headers).length) return;
    return Object.entries(headers)
        .map(([name, value]) => [name, value].join(": "))
        .join("\n");
}

async function transformBody(mimeType, body, headers) {
    if (body == null || !Object.keys(body).length) return;
    if (mimeType === "application/json") {
        return JSON.stringify(body, null, 4);
    } else if (mimeType === "application/x-www-form-urlencoded") {
        return new URLSearchParams(body).toString();
    } else if (mimeType === "multipart/form-data") {
        const contentType = new Headers(headers).get("content-type");
        const boundary = contentType.match(/boundary=([^;]+)/)[1];
        const formData = new FormData();
        formData.setBoundary(boundary);
        body.map(([name, value]) => formData.append(name, value));
        const res = new Response(formData.getBuffer());
        return await res.text();
    }
}

/**@param {import("../module").ParseResult} parsed*/
module.exports = async (parsed) => /* prettier-ignore */ template`@sessionId=sessionId
${template`${parsed.params?.map(([name,value]) => `@${name}=${value}
`).join('')}`}${template`${parsed.requests?.length&&await Promise.all(parsed.requests?.map(async (req)=>`
###
${req.method} http://localhost:3000/api/${parsed.name}/{{sessionId}}${transformPathname(req.pathname)}${template`
${transformQuery(req.query)}`}${template`
${transformHeaders(req.headers)}`}${template`

${await transformBody(req.mimeType,req.body,req.headers)}`}`))}`}`;
