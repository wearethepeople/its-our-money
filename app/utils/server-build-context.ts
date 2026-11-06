import { createContext, type ServerBuild } from "react-router";

// Populated per-request by `getLoadContext` in server/app.ts.
export const serverBuildContext = createContext<ServerBuild>();
