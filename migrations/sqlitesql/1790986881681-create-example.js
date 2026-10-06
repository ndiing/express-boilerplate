/**
 * @param {import('@ndiinginc/dal/types/migration').Context} context
 */
module.exports.up = async function up(context) {
    context.schema().createTable("example", (table) => {
        table.column("id").integer().primaryKey().identity();
        table.column("name").text();
    });
};

/**
 * @param {import('@ndiinginc/dal/types/migration').Context} context
 */
module.exports.down = async function down(context) {
    context.schema().dropTable("example");
};
