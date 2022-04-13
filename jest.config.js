const config = {
    verbose: true,
    silent: true,
    // transform: {
    //     '^.*\\.ts$': 'ts-jest'
    // },
    coverageReporters: [
        "html", // Generates ./coverage/index.html
        "json-summary", // Generates coverage-summary.json (used to alter the README.md)
    ],
    // Minimum coverage accepted
    coverageThreshold: {
        global: {
            statements: 75,
            lines: 75,
            functions: 75,
            branches: 75,
        }
    }
};

module.exports = config;
