import { RouteContent } from "./router";

export enum HttpMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
}

export enum RouteTypes {
  PUBLIC = 1,
  STATIC,
  DYNAMIC,
  CATCH_ALL,
}

export interface RoutePath {
  type: RouteTypes;
  route: string;
  filePath: string;
}

export interface GetRouteContent {
  (
    __targetDirPath: string,
    isChildren: true,
    __parentPath: string
  ): Promise<RouteContent>;
  (__routePath: string, isChildren: false): Promise<RouteContent>;
}

export type UrlOptions = {
  routesPath?: string;
  baseRoute?: string;
  publicRouteName?: string;
};
