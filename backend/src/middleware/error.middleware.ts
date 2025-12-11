import { Elysia } from "elysia";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}

export const errorMiddleware = new Elysia()
  .onError(({ code, error, set }) => {
    console.error(`[Error ${code}]:`, error);

    const errorMessage = getErrorMessage(error);
    const isDevelopment = process.env.NODE_ENV === "development";

    switch (code) {
      case "NOT_FOUND":
        set.status = 404;
        return {
          success: false,
          message: "Resource not found",
          error: errorMessage,
        };
      case "VALIDATION":
        set.status = 400;
        return {
          success: false,
          message: "Validation error",
          error: errorMessage,
        };
      case "INTERNAL_SERVER_ERROR":
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
          error: isDevelopment ? errorMessage : "Something went wrong",
        };
      default:
        set.status = 500;
        return {
          success: false,
          message: "An error occurred",
          error: isDevelopment ? errorMessage : "Unknown error",
        };
    }
  });

