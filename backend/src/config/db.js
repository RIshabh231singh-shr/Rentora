const mongoose = require("mongoose");
const env = require("./env");

async function main() {
    await mongoose.connect(env.dbConnectionString);
}

module.exports = main;