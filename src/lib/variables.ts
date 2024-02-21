try {
  require("dotenv").config();
} catch (e) {}

// KeystoneJS server config
type DB_PROVIDER_TYPE = "sqlite" | "mysql" | "postgresql";

export const KS_PORT = parseInt(process.env.KS_PORT || "3000");

export const DB_PROVIDER: DB_PROVIDER_TYPE =
  (process.env.DB_PROVIDER as DB_PROVIDER_TYPE) || "sqlite";

export const DATABASE_URL = process.env.DATABASE_URL || "file://keystone.db";

export const GRAPHQL_PATH =
  process.env.NEXT_PUBLIC_GRAPHQL_PATH ?? "/api/graphql";

export const BUCKET = {
  name: process.env.AWS_BUCKET ?? "",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpointUrl: process.env.AWS_ENDPOINT_URL,
  customUrl: process.env.AWS_CUSTOM_URL,
};

export const OPENAI = {
  endpoint:
    (process.env.OPENAI_ENDPOINT ?? "").trim().length > 0
      ? new URL(process.env.OPENAI_ENDPOINT ?? "")
      : undefined,
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? "gpt-3.5-turbo",
};
// export const OPENAI_ENDPOINT =
//   (process.env.OPENAI_ENDPOINT ?? "").trim().length > 0
//     ? new URL(process.env.OPENAI_ENDPOINT ?? "")
//     : undefined;
// export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-3.5-turbo";

export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2024-01";
