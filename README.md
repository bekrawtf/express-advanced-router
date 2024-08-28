# express-advanced-router

This module provides a robust file-based routing solution for Express.js applications. It supports a wide range of routing methods, including public and catch-all routes, with various syntax options for flexible and comprehensive route management.

You can define route types (Dynamic, Static, Catch-All, Public) by using specific syntax structures within folder names. The same flexibility applies to methods within routes. This approach helps you avoid complexity and provides a more efficient and advanced routing system.

# How to use

To use this application, first create an Express application. Pass the application as a parameter to the module exported as the default from "express-advanced-router". If a RouteOptions object is not provided, it will search for the routes folder in "src/routes". If the folder is not found, an error will be thrown.

```js
import express from "express";
import advancedRouter from "./index";
import path from "path";

const app = express();

await advancedRouter(app);

app.listen(3000);
```

## Route Options

You can use customizable settings to change the location of the routes folder, the base route (e.g., baseRoute), or the public route name. To do this, create a RouteOptions object and pass it as a parameter after your expressApp.

![routes_options](https://i.imgur.com/fm4PDyJ.png)

# Route Types & Prefixes

When defining route types, specific naming conventions should be followed. These conventions are straightforward and easy to understand. For static routes, no special syntax is required—simply name the route as needed.

| Route Type     | Description                                                                                 | RegExp                |
|----------------|---------------------------------------------------------------------------------------------|-----------------------|
| **`PUBLIC`**   | The public route should be placed in the root directory of the `routes` folder. It must be a directory and should be named `_public`. | `/^_public$/i`        |
| **`STATIC`**   | For static routes, simply name the file as the desired route.                                |                       |
| **`DYNAMIC`**  | To define a dynamic route, append `[[]]` to the folder name and place the parameter name between `[[` and `]]`. | `/^\[\[[0-9a-zA-Z]+\]\]/` |
| **`CATCH_ALL`**| To define a catch-all route, simply prefix the folder name with `$`.                         | `/^\$/`               |


![routes_named](https://i.imgur.com/XouASXj.png)
![dynamic_router_named](https://i.imgur.com/H85k5ah.png)

## Route Ordering
Routes are ordered based on their type, not by file order. This approach helps prevent inconsistencies and errors. 
 - The order of precedence is as follows: Public > Static > Dynamic > Catch-All.

![routes_short](https://i.imgur.com/ClWc8VL.png)

# Route Handlers
To define handlers within a route, you should name the file using the handler method's name. This allows you to specify the HTTP method that the file will handle. Please note the following conventions: The method name should be written in uppercase and followed by an underscore (_). After that, you can use any naming convention you prefer. For example: GET_index.ts. Both .ts and .js file extensions are supported.

Currently supported methods:

- `GET` = GET_
- `POST` = POST_
- `PUT` = PUT_
- `DELETE` = DELETE_
- `PATCH` = PATCH_
- `OPTIONS` = OPTIONS_
- `HEAD` = HEAD_

![routes_handler](https://i.imgur.com/tcxO4bN.png)