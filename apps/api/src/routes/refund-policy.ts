import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { analyzeRefundPolicy, compareAirlinePolicies, scoreRouteFlexibility, AIRLINE_POLICIES } from '../services/refund-policy.js';

const singlePolicySchema = z.object({
  airline: z.string().min(1),
  iata: z.string().length(2).toUpperCase(),
  flightNumber: z.string().optional().default('—'),
  route: z.string().optional().default('—'),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().default(new Date().toISOString().slice(0, 10)),
});

const compareSchema = z.object({
  airlines: z.string(), // comma-separated IATA codes: "BR,CI,JL"
});

const routeFlexSchema = z.object({
  options: z.string(), // JSON array: '[{"iata":"BR","price":120},{"iata":"CI","price":115}]'
});

export async function refundPolicyRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/flights/refund-policy — single airline policy analysis
  app.get('/api/flights/refund-policy', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = singlePolicySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { airline, iata, flightNumber, route, departDate } = parsed.data;

    const result = analyzeRefundPolicy(airline, iata, flightNumber, route, departDate);
    return reply.send({
      success: true,
      data: result,
      meta: {
        tip: '使用 /api/flights/refund-policy/compare?airlines=BR,CI,JL 比較多家航空公司',
      },
    });
  });

  // GET /api/flights/refund-policy/compare — compare multiple airlines
  app.get('/api/flights/refund-policy/compare', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = compareSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const iataList = parsed.data.airlines.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

    if (iataList.length < 2) {
      return reply.status(400).send({ error: 'Need at least 2 IATA codes', details: {} });
    }
    if (iataList.length > 6) {
      return reply.status(400).send({ error: 'Maximum 6 airlines for comparison', details: {} });
    }

    const results = compareAirlinePolicies(iataList);
    return reply.send({
      success: true,
      data: {
        airlines: results.map((r) => ({
          iata: r.iata,
          airline: r.airline,
          flexScore: r.flexScore,
          overallRating: r.overallRating,
          changeFee: r.policy.changeFee.regular,
          cancelPenalty: r.changeOptions.cancellationPenalty,
          creditValidity: r.policy.creditValidity,
          highlights: r.warnings.filter((w) => w.startsWith('✅')),
          concerns: r.warnings.filter((w) => w.startsWith('⚠️') || w.startsWith('⛔')),
        })),
        meta: {
          rankedBy: 'flexibility',
          winner: results[0]?.airline,
          winnerScore: results[0]?.flexScore,
        },
      },
    });
  });

  // GET /api/flights/refund-policy/score — score route flexibility across options
  app.get('/api/flights/refund-policy/score', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = routeFlexSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }

    let options: Array<{ iata: string; price: number }>;
    try {
      options = JSON.parse(parsed.data.options);
      if (!Array.isArray(options) || options.length === 0) throw new Error();
    } catch {
      return reply.status(400).send({ error: 'Invalid options JSON', details: {} });
    }

    const score = scoreRouteFlexibility(options);
    return reply.send({ success: true, data: score });
  });

  // GET /api/flights/refund-policy/airlines — list all known airlines + policies
  app.get('/api/flights/refund-policy/airlines', async (_req: FastifyRequest, reply: FastifyReply) => {
    const airlines = AIRLINE_POLICIES.map((p) => {
      const rating = p.flexScore >= 8 ? 'excellent' : p.flexScore >= 6 ? 'good' : p.flexScore >= 4 ? 'fair' : 'poor';
      return {
        iata: p.iata,
        airline: p.airline,
        airlineName: p.airlineName,
        flexScore: p.flexScore,
        overallRating: rating,
        changeFee: p.changeFee.regular,
        cancelPenalty: p.cancellationFee.nonRefundable,
        freeBag: p.baggage.freeChecked,
      };
    });

    return reply.send({
      success: true,
      data: {
        airlines: airlines.sort((a, b) => b.flexScore - a.flexScore),
        meta: {
          total: airlines.length,
          tip: '使用 ?airlines=BR,CI,JL 比較特定航空公司，或用 ?iata=BR 查單一政策',
        },
      },
    });
  });
}