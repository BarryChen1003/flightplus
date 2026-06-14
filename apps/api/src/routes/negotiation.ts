import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const NegotiationSchema = z.object({
  airline: z.string(),
  airlineIata: z.string().optional(),
  route: z.string(),
  date: z.string(),
  price: z.number(),
  currency: z.string().default('TWD'),
  cabinClass: z.string().optional(),
  competitorPrice: z.number().optional(),
  competitorUrl: z.string().optional(),
  loyaltyLevel: z.enum(['none', 'silver', 'gold', 'platinum']).default('none'),
  goal: z.enum(['price_match', 'discount', 'upgrade', 'refund']).default('discount'),
  language: z.enum(['zh-TW', 'en']).default('zh-TW'),
});

type NegotiationRequest = z.infer<typeof NegotiationSchema>;

const AIRLINE_CONTACTS: Record<string, string> = {
  BR: 'https://www.evaair.com/zh-tw/tw/contact-us/',
  CI: 'https://www.china-airlines.com/zh-tw/about-us/contact-us',
  AE: 'https://www.aeroexpress.com.tw/zh-TW/contact',
 JX: 'https://www.starlux-airlines.com/zh-TW/contact',
  IT: 'https://www.tigerairtw.com/zh-TW/contact',
  GE: 'https://www.transasiajets.com/zh-TW/contact',
  // International
  DL: 'https://www.delta.com/contact-us',
  UA: 'https://www.united.com/en/us/contact-us',
  AA: 'https://www.aa.com/i18n/customer-service/contact-us.jsp',
};

const LOYALTY_TIERS = {
  none: '一般旅客',
  silver: '銀卡會員',
  gold: '金卡會員',
  platinum: '鑽石/白金卡會員',
};

function formatPrice(price: number, currency: string): string {
  if (currency === 'USD') return `$${price.toLocaleString()} USD`;
  if (currency === 'TWD') return `NT$${price.toLocaleString()}`;
  if (currency === 'JPY') return `¥${price.toLocaleString()} JPY`;
  return `${currency} ${price.toLocaleString()}`;
}

function buildEmailHtml(data: NegotiationRequest, email: { subject: string; body: string; tips: string[]; escalation: string[] }): string {
  const airlineLabel = data.airline || data.airlineIata || '航空公司';
  const goalLabel = { price_match: '價格匹配', discount: '爭取折扣', upgrade: '升等機會', refund: '退款申請' }[data.goal];

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${email.subject}</title>
<style>
  body { font-family: -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif; background: #0a0a0f; color: #ffffff; margin: 0; padding: 20px; }
  .container { max-width: 680px; margin: 0 auto; }
  .card { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
  .header { background: linear-gradient(135deg, #00d4ff, #7c3aed); padding: 24px 28px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #0a0a0f; }
  .header p { margin: 6px 0 0; font-size: 13px; color: rgba(10,10,15,0.7); }
  .section { padding: 20px 28px; border-bottom: 1px solid #2a2a3a; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 11px; font-weight: 600; color: #00d4ff; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .meta-item { background: #12121a; border-radius: 8px; padding: 12px; }
  .meta-label { font-size: 11px; color: #8b8b9e; margin-bottom: 4px; }
  .meta-value { font-size: 15px; font-weight: 600; color: #ffffff; }
  .email-body { font-size: 14px; line-height: 1.8; color: #d1d1d1; white-space: pre-wrap; }
  .tip { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #2a2a3a; }
  .tip:last-child { border-bottom: none; }
  .tip-num { width: 22px; height: 22px; background: #00d4ff; color: #0a0a0f; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tip-text { font-size: 13px; color: #b0b0b0; line-height: 1.6; }
  .escalation-item { padding: 10px 14px; background: #12121a; border-radius: 8px; margin-bottom: 8px; font-size: 13px; color: #b0b0b0; }
  .escalation-item strong { color: #00d4ff; }
  .flight-badge { display: inline-block; background: #12121a; border: 1px solid #2a2a3a; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #8b8b9e; }
  .price-tag { font-size: 24px; font-weight: 700; color: #00d4ff; }
  .copy-btn { display: inline-block; background: #00d4ff; color: #0a0a0f; border: none; border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; }
  .warning-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #f59e0b; line-height: 1.6; margin-top: 12px; }
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="card">
    <div class="header">
      <h1>✈️ ${airlineLabel} 價格談判郵件</h1>
      <p>目標：${goalLabel} · ${data.route} · ${data.date} · ${formatPrice(data.price, data.currency)}</p>
    </div>

    <!-- Route Meta -->
    <div class="section">
      <div class="section-title">機票資訊</div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">航空公司</div>
          <div class="meta-value">${airlineLabel}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">航線</div>
          <div class="meta-value">${data.route}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">出發日期</div>
          <div class="meta-value">${data.date}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">當前價格</div>
          <div class="meta-value price-tag">${formatPrice(data.price, data.currency)}</div>
        </div>
        ${data.competitorPrice ? `
        <div class="meta-item">
          <div class="meta-label">競爭對手價格</div>
          <div class="meta-value" style="color:#10b981">${formatPrice(data.competitorPrice, data.currency)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">價差</div>
          <div class="meta-value" style="color:#f59e0b">省 ${formatPrice(data.competitorPrice - data.price, data.currency)}</div>
        </div>` : ''}
        <div class="meta-item">
          <div class="meta-label">您的會員等級</div>
          <div class="meta-value">${LOYALTY_TIERS[data.loyaltyLevel]}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Email Preview -->
  <div class="card">
    <div class="section">
      <div class="section-title">郵件正文</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-size:12px; color:#8b8b9e;">主旨：${email.subject}</span>
      </div>
      <div class="email-body">${email.body.replace(/\n/g, '<br>')}</div>
      <div class="warning-box">
        ⚠️ 建議直接複製郵件正文貼到航空公司官方的「聯絡我們」表單或會員服務信箱，而非使用 Gmail/Yahoo 發送，可提高回應率。
      </div>
    </div>
  </div>

  <!-- Negotiation Tips -->
  <div class="card">
    <div class="section">
      <div class="section-title">談判技巧</div>
      ${email.tips.map((tip, i) => `
      <div class="tip">
        <div class="tip-num">${i + 1}</div>
        <div class="tip-text">${tip}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- Escalation Paths -->
  <div class="card">
    <div class="section">
      <div class="section-title">升級途徑</div>
      ${email.escalation.map(step => `
      <div class="escalation-item">${step}</div>`).join('')}
    </div>
  </div>

</div>
</body>
</html>`;
}

async function generateNegotiationEmail(data: NegotiationRequest) {
  const goalMap = {
    price_match: '價格匹配：要求航空公司匹配競爭對手的更低價格',
    discount: '爭取折扣：要求在現有價格基礎上爭取額外優惠',
    upgrade: '升等機會：請求商務艙或豪華經濟艙升等機會',
    refund: '退款申請：針對已购票价格过高的补偿申请',
  };

  const prompt = `你是一位專業的航空公司客戶服務談判顧問，專為旅客撰寫向航空公司爭取價格匹配的英文郵件。

【機票資訊】
- 航空公司：${data.airline || data.airlineIata || '航空公司'}
- 航線：${data.route}
- 出發日期：${data.date}
- 機票價格：${formatPrice(data.price, data.currency)}
- 競爭對手價格：${data.competitorPrice ? formatPrice(data.competitorPrice, data.currency) : '未提供'}
- 會員等級：${LOYALTY_TIERS[data.loyaltyLevel]}
- 談判目標：${goalMap[data.goal]}

【語言要求】
必須使用繁體中文撰寫郵件正文。專業、有禮貌但立場堅定。

【郵件結構要求】
1. 稱呼（使用航空公司名稱 + 客服團隊）
2. 第一段：自我介紹 + 機票資訊（航班號、日期、價格、訂位代號預留位置）
3. 第二段：說明談判理由${data.competitorPrice ? '（引用競爭對手價格差異）' : ''}${data.loyaltyLevel !== 'none' ? '（引用忠誠顧客身份）' : ''}
4. 第三段：具體訴求（價格匹配/折扣/升等，視目標而定）
5. 第四段：說明如果不處理將考慮的選項（取消預訂、公開分享經驗等，但語氣禮貌）
6. 結尾：感謝 + 希望回覆期限（建議3-5個工作天）+ 聯絡方式預留

【談判技巧建議（3條）】
基於航空公司談判的最佳實踐，提供：
1. 打電話比發郵件更有效（強調親自致電的時機和話術）
2. 最佳致電時間（週中上午、避開週一週五）
3. 如果被拒絕，如何升級投訴（ supervisor、旅客保護機構、信用卡 dispute）

【升級途徑（2-3條）】
1. 官方投訴管道
2. 第三方調解機構（如：民航局、消保會、信用卡爭議）
3. 社群媒體公開經驗（最後手段但有效）

請以 JSON 格式回覆，包含：
{
  "subject": "郵件主旨",
  "body": "郵件正文（完整繁體中文，可直接使用的版本，保留預留位置如[姓名]、[訂位代號]等）",
  "tips": ["技巧1", "技巧2", "技巧3"],
  "escalation": ["升級途徑1", "升級途徑2"]
}

只回覆 JSON，不要有任何其他文字。`;

  const response = await fetch(process.env.NVIDIA_NIM_URL || 'https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/llama-3.3-nemotron-super-49b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API failed: ${response.status}`);
  }

  const result = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = result.choices?.[0]?.message?.content ?? '';
  
  // Parse JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse LLM response');
  
  return JSON.parse(jsonMatch[0]);
}

export async function negotiationRoutes(app: FastifyInstance) {
  app.post('/api/negotiation/email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = NegotiationSchema.parse(request.body);
      const emailData = await generateNegotiationEmail(body);
      const html = buildEmailHtml(body, emailData);

      return reply.send({
        success: true,
        data: {
          ...emailData,
          html,
          meta: {
            airline: body.airline || body.airlineIata,
            route: body.route,
            date: body.date,
            price: body.price,
            currency: body.currency,
            goal: body.goal,
            loyaltyLevel: body.loyaltyLevel,
          }
        }
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: 'Invalid request', details: err.errors });
      }
      request.log.error(err);
      return reply.status(500).send({ success: false, error: 'Failed to generate negotiation email' });
    }
  });

  app.get('/api/negotiation/airlines', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: Object.entries(AIRLINE_CONTACTS).map(([iata, url]) => ({ iata, url })),
    });
  });
}