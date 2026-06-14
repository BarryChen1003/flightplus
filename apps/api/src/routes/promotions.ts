import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { detectPromotions } from '../services/promo-detector.js';
import type { PromotionResponse } from '../types/index.js';

const promoSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  currency: z.string().optional().default('USD'),
  threshold: z.coerce.number().min(0).max(100).optional().default(15),
});

export async function promotionRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/flights/promotions — detect active sales on a route
  app.get('/api/flights/promotions', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = promoSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { origin, destination, currency, threshold } = parsed.data;

    try {
      const result = await detectPromotions(origin, destination, currency, threshold);
      const response: PromotionResponse = {
        origin,
        destination,
        analyzedAt: new Date().toISOString(),
        hasActivePromotion: result.deals.length > 0,
        deals: result.deals,
        meta: {
          currentAvgPrice: result.avgPrice,
          historicalAvgPrice: result.historicalAvg,
          priceDropPercent: result.priceDrop,
          airlinesAnalyzed: result.airlines,
          confidence: result.confidence,
        },
      };
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Promotion detection failed';
      app.log.error({ err }, 'promotions error');
      return reply.status(502).send({ error: 'Upstream API error', details: message });
    }
  });
}