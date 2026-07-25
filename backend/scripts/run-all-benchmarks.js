const { runLoadBenchmarks } = require("../tests/load/load-test");
const { runStressTest } = require("../tests/load/stress-test");
const { runSoakTest } = require("../tests/load/soak-test");
const { runSocketLoadTest } = require("../tests/load/socket-load-test");
const { runDbPerformanceTest } = require("../tests/load/db-perf-test");
const { generateReports } = require("./generate-reports");

const runAllBenchmarks = async () => {
    console.log("=================================================");
    console.log("   RENTORA BACKEND SUITE BENCHMARK EXECUTION     ");
    console.log("=================================================\n");

    try {
        console.log("[1/5] Running Load Benchmarks (10 - 1,000 Concurrent Users)...");
        await runLoadBenchmarks();

        console.log("\n[2/5] Running Progressive Stress Test...");
        await runStressTest();

        console.log("\n[3/5] Running Soak & Stability Test...");
        await runSoakTest();

        console.log("\n[4/5] Running Socket.IO Real-Time Benchmark...");
        await runSocketLoadTest();

        console.log("\n[5/5] Running MongoDB Performance & Index Inspection...");
        await runDbPerformanceTest();

        console.log("\n[Reports] Aggregating Data & Building Performance Reports...");
        generateReports();

        console.log("\n=================================================");
        console.log("   ALL BENCHMARKS COMPLETED SUCCESSFULLY!        ");
        console.log("=================================================");
    } catch (err) {
        console.error("Benchmark Execution Error:", err);
        process.exit(1);
    }
};

if (require.main === module) {
    runAllBenchmarks();
}

module.exports = { runAllBenchmarks };
