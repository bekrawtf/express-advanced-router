/* =================== USAGE ===================

    import express from "express"; ---> express.js
    import router from "express-file-router"
    var app = express();
    router(app)

 =============================================== */

import type { Express } from "express-serve-static-core";
import { ExpressAdvancedRouter } from "./router/index";
import { UrlOptions } from "./types";
export * from "./types";

export default async function (expressApp: Express, options?: UrlOptions) {
  if (!expressApp) throw new Error("Express App is required!");

  const advancedRouter = new ExpressAdvancedRouter(expressApp, options);

  advancedRouter
    .getRouteContent(advancedRouter.__routesPath, false)
    .then((routes) => advancedRouter.createRoutes(routes));
}
