import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    overwrite: true,
    schema: "./queries/github/schema.graphqls",
    documents: ["./src/**/queries.ts"],
    generates: {
        "src/queries.data.ts": {
            plugins: ["typescript", "typescript-operations"],
        },
    },
};

export default config;
