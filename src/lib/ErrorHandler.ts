export const ErrorHandler = (error: unknown) => {
  if (error instanceof Error) {
    // This condition checks if error is of type Error
    return {
      status: "error",
      error: error.message,
    };
  } else {
    return {
      status: "error",
      error: "An unexpected error occurred.",
    };
  }
};
