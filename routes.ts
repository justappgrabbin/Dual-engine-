import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chartRequestSchema } from "@shared/schema";
import { processChat } from "./chat";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1),
  chartData: z.any().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/chat", async (req, res) => {
    try {
      const parseResult = chatRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request" });
      }
      
      const { message, chartData } = parseResult.data;
      const response = processChat(message, chartData || null);
      
      return res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({ error: "Chat processing failed" });
    }
  });

  app.post("/api/chart", async (req, res) => {
    try {
      const parseResult = chartRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: parseResult.error.errors,
        });
      }
      
      const { placements, transitSun } = parseResult.data;
      
      const result = await storage.analyzeChart(placements, transitSun);
      
      return res.json(result);
    } catch (error) {
      console.error("Chart analysis error:", error);
      return res.status(500).json({
        error: "Failed to analyze chart",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
