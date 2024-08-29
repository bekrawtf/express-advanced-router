/* =================== USAGE ===================

    import express from "express"; ---> express.js
    import router from "express-advanced-router"
    var app = express();
    router(app)

 =============================================== */

import type { Express } from "express-serve-static-core";
import { ExpressAdvancedRouter } from "./router/index.js";
import { RouteOptions } from "./types.js";
export * from "./types.js";

export default async function (expressApp: Express, options?: RouteOptions) {
  if (!expressApp) throw new Error("Express App is required!");

  const advancedRouter = new ExpressAdvancedRouter(expressApp, options);

  advancedRouter
    .getRouteContent(advancedRouter.__routesPath, false)
    .then((routes) => advancedRouter.createRoutes(routes));
}
