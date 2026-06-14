import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { calculateTrueCost, AIRLINE_FEES } from '../services/fee-schedule.js';

const feeQuerySchema = z.object({
  airline: z.string().length(2).toUpperCase(),
  baseFare: z.coerce.number().min(0),
  passengers: z.coerce.number().int().min(1).max(9).optional().default(1),
  bagsEach: z.coerce.number().int().min(0).max(3).optional().default(1),
  seatType: z.enum(['none', 'standard', 'extra_legroom', 'preferred']).optional().default('standard'),
  currency: z.string().optional().default('USD'),
});

export async function feeRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/flights/fees — break down true all-in cost for an airline
  app.get('/api/flights/fees', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = feeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.format() });
    }
    const { airline, baseFare, passengers, bagsEach, seatType, currency } = parsed.data;

    const breakdown = calculateTrueCost(airline, baseFare, passengers, bagsEach, seatType, currency);

    return {
      airline,
      baseFare,
      currency,
      passengers,
      breakdown,
    };
  });

  // GET /api/flights/fees/schedule — get fee schedule for all known airlines
  app.get('/api/flights/fees/schedule', async (_req: FastifyRequest, _reply: FastifyReply) => {
    const airlines = Object.values(AIRLINE_FEES).map((f) => ({
      iata: f.airline,
      name: f.airlineName,
      includesCheckedBag: f.checkedBag.included ?? false,
      includesCarryOn: f.carryOn.fee === 0,
      includesSeatSelection: f.seatSelection.standard === 0,
      includesMeal: f.meal === 0,
      includesWifi: f.wifi === 0,
      changeFee: f.changeFee,
      cancellationFee: f.cancellationFee,
      hiddenFeeScore: f.checkedBag.included ? 0 : Math.min(10, Math.round((f.checkedBag.first + f.carryOn.fee + f.seatSelection.standard) / 10)),
    }));

    return {
      airlines,
      meta: {
        totalAirlines: airlines.length,
        tip: '使用 /api/flights/fees?airline=X&baseFare=Y 計算某航班的完整成本',
      },
    };
  });
}