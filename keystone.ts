import { config } from "@keystone-6/core";

import { session, withAuth } from "./admin/auth";
import { lists } from "./admin/schema/_lists";
import {
  BUCKET,
  DATABASE_URL,
  DB_PROVIDER,
  GRAPHQL_PATH,
  KS_PORT,
} from "./src/lib/variables";
import { Role } from "./src/lib/types/auth";

export default withAuth(
  config({
    server: {
      port: KS_PORT,
    },
    ui: {
      // fix: AdminMeta access denied when login to admin ui
      isAccessAllowed: (ctx) => ctx.session?.data?.role === Role.Admin,
    },
    db: {
      provider: DB_PROVIDER,
      url: DATABASE_URL,
    },
    storage: {
      image_store: {
        kind: "s3",
        // type: "file",
        type: "image",
        region: "auto",
        bucketName: BUCKET.name,
        accessKeyId: BUCKET.accessKeyId,
        secretAccessKey: BUCKET.secretAccessKey,
        endpoint: BUCKET.endpointUrl,
        pathPrefix: "images/",
        generateUrl: (path) => {
          const original = new URL(path);
          const customUrl = new URL(original.pathname, BUCKET.customUrl);
          return customUrl.href;
        },
      },
    },

    lists,
    graphql: { path: GRAPHQL_PATH },
    session,
  }),
);
