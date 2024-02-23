import { S3, S3ClientConfig } from "@aws-sdk/client-s3";

import { BUCKET } from "../../../../src/lib/variables";

export const s3 = new S3({
  endpoint: BUCKET.endpointUrl,
  credentials: {
    accessKeyId: BUCKET.accessKeyId,
    secretAccessKey: BUCKET.secretAccessKey,
  },
  region: "auto",
} as S3ClientConfig);
