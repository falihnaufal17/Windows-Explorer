import { Elysia } from "elysia";

export const loggerMiddleware = new Elysia()
  .onBeforeHandle(({ request, path }) => {
    console.log(`[${new Date().toISOString()}] ${request.method} ${path}`);
  })
  .onAfterHandle(({ request, path, response }) => {
    const status = response instanceof Response ? response.status : 200;
    console.log(`[${new Date().toISOString()}] ${request.method} ${path} - ${status}`);
  });

