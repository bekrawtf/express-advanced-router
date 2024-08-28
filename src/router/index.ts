import express, { Handler } from "express";
import fs from "fs/promises";
import path from "path";
import {
  HttpMethods,
  RoutePath,
  RouteTypes,
  GetRouteContent,
  RouteOptions,
} from "../types";
import { pathToFileURL } from "url";
import type { Express } from "express-serve-static-core";

export class RouteConfig {
  public method: HttpMethods;
  public module;
  public middlewares: Handler[] = [];

  constructor() {
    this.method ||= HttpMethods.GET;
    this.module ||= (() => {}) as Handler;
  }

  setMiddlewares(middlewares: Handler[]) {
    this.middlewares = [...this.middlewares, ...middlewares];
  }
}

export class RouteContent {
  public path: RoutePath;
  public name?: string;
  public configs: RouteConfig[] = [];
  public children: RouteContent[] = [];

  constructor() {
    this.path = {} as RoutePath;
  }

  setChildren(route: RouteContent[]) {
    this.children = [...this.children, ...route];
  }

  upConfigs(config: RouteConfig) {
    this.configs = [...this.configs, config];
  }
}

class RouteSettings {
  public __routesPath = path.join(process.cwd(), "src", "routes");
  private __baseRoute: string | undefined = undefined;
  private __publicRouteName: string | undefined = undefined;

  constructor(urlOptions?: RouteOptions) {
    if (urlOptions) {
      const { baseRoute, publicRouteName, routesPath } = urlOptions;

      baseRoute && (this.__baseRoute = baseRoute);
      publicRouteName && (this.__publicRouteName = publicRouteName);
      routesPath && (this.__routesPath = routesPath);
    }
  }

  public patterns = {
    private_route_name: /^\$/,
    public_route_name: /^_public$/i,
    method: /^[A-Z]+\_/,
    underline: /[_]/,
    slash: /[\/\\]/g,
    dynamic_path: /^\[\[[0-9a-zA-Z]+\]\]/,
    dynamic_path_borders: /[\[\]]/g,
    multi_slash: /\/{2,}/g,
    dots: /\./g,
  };

  methodsArr: HttpMethods[] = [
    HttpMethods.GET,
    HttpMethods.DELETE,
    HttpMethods.HEAD,
    HttpMethods.OPTIONS,
    HttpMethods.PATCH,
    HttpMethods.POST,
    HttpMethods.PUT,
  ];

  converterRouteNames = {
    [RouteTypes.STATIC]: (fileName: string) => fileName,
    [RouteTypes.DYNAMIC]: (fileName: string) => {
      return `:${fileName.replaceAll(this.patterns.dynamic_path_borders, "")}`;
    },
    [RouteTypes.PUBLIC]: (fileName: string) => "/",
    [RouteTypes.CATCH_ALL]: (fileName: string) => {
      return "*";
    },
  };

  routeNameInFilePath = (filePath: string) => {
    return filePath
      .replace(this.patterns.slash, "/")
      .split("/")
      .pop() as string;
  };

  isMethod = (methodName: string): methodName is HttpMethods => {
    return this.methodsArr.includes(methodName as HttpMethods);
  };

  isCatchAllRoute = (fileName: string) => {
    const hasPrivateName = fileName.match(this.patterns.private_route_name);
    return hasPrivateName ? true : false;
  };

  isPublicRoute = (fileParentPath: string, fileName: string) => {
    if (fileParentPath != path.join(this.__routesPath, fileName)) return false;

    const hasPublicRouteName = fileName.match(this.patterns.public_route_name);

    return hasPublicRouteName ? true : false;
  };

  isDynamicRoute = (fileName: string) => {
    const hasDynamicPrefix = fileName?.match(this.patterns.dynamic_path);

    if (!hasDynamicPrefix) return false;

    return true;
  };

  getHttpMethod = (fileName: string) => {
    const pattern_method = this.patterns.method;

    const haveMethodPrefix = fileName
      .match(pattern_method)?.[0]
      ?.replace(this.patterns.underline, "");

    if (haveMethodPrefix) {
      if (this.isMethod(haveMethodPrefix)) {
        return HttpMethods[haveMethodPrefix];
      }
    }

    return HttpMethods.GET;
  };

  getRouteType = (filePath: string) => {
    const fileName = this.routeNameInFilePath(filePath);

    return this.isCatchAllRoute(fileName)
      ? RouteTypes.CATCH_ALL
      : this.isPublicRoute(filePath, fileName)
      ? RouteTypes.PUBLIC
      : this.isDynamicRoute(fileName)
      ? RouteTypes.DYNAMIC
      : RouteTypes.STATIC;
  };

  createRouteAddress(
    routeName: string,
    routeType: RouteTypes,
    __parentPath?: string
  ) {
    let address: string;

    if (routeType == RouteTypes.PUBLIC) {
      if (this.__publicRouteName) {
        address = "/" + this.__publicRouteName;
      } else {
        address = "/public";
      }
    } else if (__parentPath) {
      address = `${__parentPath}/${routeName}`;
    } else {
      address = routeName;
    }

    if (this.__baseRoute && (!__parentPath || routeType == RouteTypes.PUBLIC)) {
      address = `/${this.__baseRoute}/${address}`;
    }

    const replacedAddress = address.replaceAll(this.patterns.multi_slash, "/");

    return replacedAddress;
  }

  pathContent = (filePath: string, __parentPath?: string) => {
    const isBasePath = filePath == this.__routesPath;

    let routeType = this.getRouteType(filePath);

    let routeName = isBasePath
      ? "/"
      : this.converterRouteNames[routeType](this.routeNameInFilePath(filePath));

    const address = this.createRouteAddress(routeName, routeType, __parentPath);

    const pathData: Omit<RoutePath, "filePath"> = {
      route: address,
      type: routeType,
    };

    return pathData;
  };

  getRoutePath = (filePath: string, __parentPath?: string) => {
    const { route, type } = this.pathContent(filePath, __parentPath);

    console.log(route);

    const routePath = {
      filePath,
      route: route,
      type,
    } as RoutePath;

    return routePath;
  };

  readRouteFile = async (__route: string) => {
    const { default: routeFunc, middlewares } = await import(
      pathToFileURL(__route).href
    );

    if (!routeFunc || typeof routeFunc !== "function") {
      throw new Error("Route function is not found");
    }

    if (middlewares && Array.isArray(middlewares)) {
      return {
        routeFunc: routeFunc as Handler,
        middlewares: middlewares as Handler[],
      };
    }

    return { routeFunc: routeFunc as Handler };
  };

  sortChildrenWithPathType = (children: RouteContent[]) => {
    return children.sort((a, b) => {
      if (a.path.type < b.path.type) {
        return -1;
      } else if (a.path.type > b.path.type) {
        return 1;
      }
      return 0;
    });
  };
}

export class ExpressAdvancedRouter extends RouteSettings {
  constructor(private app: Express, urlOptions?: RouteOptions) {
    super(urlOptions);
    this.__routesPathControl();
  }

  private async __routesPathControl() {
    const isHave = await fs
      .access(this.__routesPath)
      .then(() => true)
      .catch(() => null);

    if (!isHave) {
      throw new Error("src/routes File path is required");
    }
  }

  async dirContent(targetDir: string) {
    const dirContent = await fs.readdir(targetDir, {
      withFileTypes: true,
    });

    const files = dirContent.filter((file) => {
      if (!file.isFile()) return false;
      const extension = file.name.split(this.patterns.dots).pop();

      return extension == "js" || extension == "ts";
    });
    const folders = dirContent.filter((file) => file.isDirectory());

    return [files, folders];
  }

  getRouteContent: GetRouteContent = async (
    __targetDirPath: string,
    isChildren: boolean,
    __parentPath?: string | undefined
  ) => {
    const [files, folders] = await this.dirContent(__targetDirPath);

    const appRoutes = new RouteContent();

    const __path = this.getRoutePath(__targetDirPath, __parentPath);

    appRoutes.path = __path;

    if (files && files?.length > 0) {
      for (const file of files) {
        const route = new RouteConfig();

        const { name, parentPath } = file;
        const method = this.getHttpMethod(name);

        route.method = method;

        const filePath = path.join(parentPath, name);

        const { routeFunc, middlewares } = await this.readRouteFile(filePath);

        middlewares &&
          middlewares?.length > 0 &&
          route.setMiddlewares(middlewares);
        route.module = routeFunc;

        appRoutes.upConfigs(route);
      }
    }

    if (folders && folders?.length > 0) {
      const children: RouteContent[] = [];

      for (const folder of folders) {
        const { name, parentPath } = folder;

        const __folderPath = path.join(parentPath, name);

        const child = await this.getRouteContent(
          __folderPath,
          true,
          __path.route
        );

        if (child) {
          children.push(child);
        }
      }

      if (children && children?.length > 0) {
        const filteredChildrenList = this.sortChildrenWithPathType(children);
        appRoutes.setChildren(filteredChildrenList);
      }
    }

    return appRoutes;
  };

  createRoutes = (routesObject: RouteContent) => {
    const { path, name, configs, children } = routesObject;
    const { route, filePath, type } = path;
    if (!route) throw new Error("unexpected data");

    if (configs && configs?.length > 0 && path.type !== RouteTypes.PUBLIC) {
      for (const config of configs) {
        const { module, method, middlewares } = config;

        if (!module || !method) continue;

        const selectedMethod = method == HttpMethods.GET ? "get" : "post";

        if (middlewares && middlewares?.length > 0) {
          this.app[selectedMethod](route, ...middlewares, module);
        } else {
          this.app[selectedMethod](route, module);
        }
      }
    } else if (path.type === RouteTypes.PUBLIC) {
      this.app.use(route, express.static(filePath));
    }

    if (children && children?.length > 0) {
      for (const child of children) {
        this.createRoutes(child);
      }
    }
  };
}
