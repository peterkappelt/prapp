import { ProcessesApi } from "@/api/apis/ProcessesApi";
import React, { useContext } from "react";
import { useImmer } from "use-immer";
import { Configuration, TokenApi } from "./api";

interface TApiContext {
  authenticated: boolean;
  token: TokenApi;
  processes: ProcessesApi;
}

interface TTokens {
  accessToken?: string;
  refreshToken?: string;
}

const Ctx = React.createContext<TApiContext | undefined>(undefined);

const ApiContext = ({ children }: { children: React.ReactNode }) => {
  const [tokens, setTokens] = useImmer<TTokens>({});

  const conf = new Configuration({
    basePath: "http://localhost:8000",
    accessToken: () => {
      return tokens.accessToken ?? "";
    },
  });

  return (
    <Ctx.Provider
      value={{
        authenticated: !!tokens.accessToken,
        token: new TokenApi(conf).withPostMiddleware(async (ctx) => {
          const res = await ctx.response.json();
          setTokens((draft) => {
            if ("access" in res) draft.accessToken = res["access"];
            if ("refresh" in res) draft.refreshToken = res["refresh"];
          });
        }),
        processes: new ProcessesApi(conf),
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

export { ApiContext, useApi };
