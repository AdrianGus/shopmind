import {
  isServiceError,
  type ServiceErrorCode,
} from "../../utils/errors.js";

export type ToolErrorCode = ServiceErrorCode | "TOOL_FAILURE";

export type ToolErrorResult = {
  ok: false;
  error: {
    code: ToolErrorCode;
    message: string;
    statusCode: number;
  };
};

export const runToolSafely = async <Result>(
  operation: () => Promise<Result> | Result,
): Promise<Result | ToolErrorResult> => {
  try {
    return await operation();
  } catch (error) {
    if (isServiceError(error)) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
      };
    }

    console.error("Unexpected tool failure", error);

    return {
      ok: false,
      error: {
        code: "TOOL_FAILURE",
        message: "Não consegui executar essa operação agora. Pode tentar novamente?",
        statusCode: 500,
      },
    };
  }
};
