import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { handleAgentRequest } from "../controllers/agent.controller.js";

export const agentRouter: ExpressRouter = Router();

agentRouter.post("/", handleAgentRequest);
