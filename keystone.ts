import { config } from "@keystone-6/core";
import { NextApiRequest, NextApiResponse } from "next";

import { type Context } from ".keystone/types";
import { type PrismaClient } from ".prisma/client";

import { session, withAuth } from "./admin/auth";
import { lists } from "./admin/schema/_lists";
import {
  BUCKET,
  DATABASE_URL,
  DB_PROVIDER,
  GRAPHQL_PATH,
  KS_PORT,
} from "./src/lib/variables";
import { start } from "./admin/lib/tasks/task";
import {
  fetchAllProductsAPI,
  pushProductAPI,
  pushSEOTaskProductAPI,
} from "./admin/routes/shopify";
import { retryTaskAPI } from "./admin/routes/tasks";

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
        // fetch store products from shopify
        app.post(
          "/api/store/fetch-all-products",
          withContext(context, fetchAllProductsAPI),
        );
        // push product
        app.post("/api/product/push", withContext(context, pushProductAPI));
        // push task products
        app.post(
          "/api/task/push-products",
          withContext(context, pushSEOTaskProductAPI),
        );
        // retry task
        app.post("/api/task/retry", withContext(context, retryTaskAPI));
      },
    },
    ui: {
      // fix: AdminMeta access denied when login to admin ui
      isAccessAllowed: (ctx) => !!ctx.session?.itemId,
    },
    db: {
      provider: DB_PROVIDER,
      url: DATABASE_URL,
      // NOTE: server start initialization
      onConnect: async (context) => {
        // NOTE: create default instructions
        const prisma = context.sudo().prisma as PrismaClient;
        const count = await prisma.instruction.count();
        if (count === 0) {
          await prisma.instruction.createMany({
            data: [
              {
                name: "SeoTask",
                instruction:
                  'You are a professional, Google-aligned SEO expert for shopify products. You will receive a list of product information. In this list, each product will have a title. Generate SEOTitle (50-60 words, using a format of adjective + attribute) and SEODescription (150-160 words) for each based on the product title. Append the generated fields to each product and keep other fields unchanged. Your response should be in a json array and strictly follow the type hint: `{"id": string, "SEOTitle": string, "SEODescription": string}[]`, with no unnecessary space or new line. Thank you and I will tip you $200',
              },
            ],
          });
        }
        // NOTE: start AI tasks
        start(context);
      },
    },
    storage: {
      input_file_storage: {
        kind: "s3",
        type: "file",
        region: "auto",
        bucketName: BUCKET.name,
        accessKeyId: BUCKET.accessKeyId,
        secretAccessKey: BUCKET.secretAccessKey,
        endpoint: BUCKET.endpointUrl,
        pathPrefix: "inputFiles/",
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
