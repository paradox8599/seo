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

import { type Context } from ".keystone/types";
import { NextApiRequest, NextApiResponse } from "next";


function withContext<
  F extends (
    req: NextApiRequest,
    res: NextApiResponse,
    context: Context,
  ) => void,
>(commonContext: Context, f: F) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return async (req: any, res: any) => {
    // const request = req as NextApiRequest;
    // const reponse = res as NextApiResponse;
    return f(req, res, await commonContext.withRequest(req, res));
  };
}


export default withAuth(
  config({
    server: {
      port: KS_PORT,
      extendExpressApp(app, context) {
        app.get("/api/example", withContext(context, (_req, res, _context) => res.json({ hello: "world" })));
      },

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
      file_store: {
        kind: "s3",
        type: "file",
        region: "auto",
        bucketName: BUCKET.name,
        accessKeyId: BUCKET.accessKeyId,
        secretAccessKey: BUCKET.secretAccessKey,
        endpoint: BUCKET.endpointUrl,
        pathPrefix: "files/",
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
