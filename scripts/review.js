const fs = require("fs");
const path = require("node:path");
const util = require("util");

const { styleText } = util;

async function generate({ dir, excludes = [], includes = [] } = {}) {
    try {
        let code = "";

        for (const dirent of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
            const file = path.join(dirent.parentPath, dirent.name);
            const relative = file.replace(dir, "");
            const extname = path.extname(file).slice(1);

            if (
                //
                excludes.some((regex) => regex.test(file)) ||
                dirent.isDirectory() ||
                !includes.some((regex) => regex.test(file))
            ) {
                // console.log(styleText(['yellow'],"↶"), styleText(['dim'],relative));

                continue;
            }

            code += `## ${relative}\n`;
            code += "\n";
            code += `\`\`\`${extname}\n`;
            code += fs.readFileSync(file) + "\n";
            code += "\n";
            code += "```\n";

            console.log(styleText(["white"], "↷"), styleText(["dim"], relative));
        }

        const file = path.resolve("temp", "review.md");
        const relative = file.replace(dir, "");
        fs.writeFileSync(file, code);

        console.log(styleText(["green"], "✓"), styleText(["dim"], relative));
    } catch (error) {
        console.log(styleText(["red"], "✗"), styleText(["dim"], dir));
    }
}
module.exports.generate = generate;

function remove() {
    const file = path.resolve("temp", "review.md");
    const relative = file.replace(path.resolve(), "");
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
    console.log(styleText(["green"], "✓"), styleText(["dim"], relative));
}
module.exports.remove = remove;
