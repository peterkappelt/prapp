import { ProcessesApi } from "@/api/apis/ProcessesApi";
import React, { useContext } from "react";
import { useImmer } from "use-immer";
import { Configuration, ExecutionsApi, ResponseContext, TokenApi } from "./api";

interface TApiContext {
  authenticated: boolean;
  token: TokenApi;
  processes: ProcessesApi;
  executions: ExecutionsApi;
}

interface TTokens {
  accessToken?: string;
  refreshToken?: string;
}

const Ctx = React.createContext<TApiContext | undefined>(undefined);

const ApiContext = ({ children }: { children: React.ReactNode }) => {
  const [tokens, setTokens] = useImmer<TTokens>({
    accessToken: localStorage.getItem("accessToken") ?? undefined,
    refreshToken: localStorage.getItem("refreshToken") ?? undefined,
  });

  const conf = new Configuration({
    basePath: import.meta.env.VITE_BACKEND_URL,
    accessToken: () => {
      return tokens.accessToken ?? "";
    },
  });

  /**
   * Invalidate the access token in case it is expired
   * An expired token returns 401 status with JSON body,
   * where res["code"] = "token_not_valid"
   */
  const invalidateTokenMiddleware = async (ctx: ResponseContext) => {
    /**
     * TODO this is completely missing the refresh token logic
     * We should probably try to obtain a new access token here
     * and redo the request
     */
    if (ctx.response.status != 401) return;
    const res = await ctx.response.json();
    if (!("code" in res) || res["code"] != "token_not_valid") return;
    localStorage.removeItem("accessToken");
    setTokens((draft) => {
      delete draft.accessToken;
    });
  };

  return (
    <Ctx.Provider
      value={{
        authenticated: !!tokens.accessToken,
        token: new TokenApi(conf).withPostMiddleware(async (ctx) => {
          const res = await ctx.response.json();
          setTokens((draft) => {
            if ("access" in res) {
              draft.accessToken = res["access"];
              localStorage.setItem("accessToken", res["access"]);
            }
            if ("refresh" in res) {
              draft.refreshToken = res["refresh"];
              localStorage.setItem("refreshToken", res["refresh"]);
            }
          });
        }),
        processes: new ProcessesApi(conf).withPostMiddleware(
          invalidateTokenMiddleware
        ),
        executions: new ExecutionsApi(conf).withPostMiddleware(
          invalidateTokenMiddleware
        ),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

const useApi = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApi must be called within ApiContext");
  return ctx;
};

// eslint-disable-next-line react-refresh/only-export-components
export { ApiContext, useApi };
