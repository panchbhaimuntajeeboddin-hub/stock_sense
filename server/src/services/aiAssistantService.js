import prisma from '../config/db.js';
import http from 'http';
import https from 'https';

export const processInventoryQuery = async (userMessage, userId) => {
  const query = (userMessage || '').trim().toLowerCase();

  // 1. DATABASE GROUNDING STEP - RETRIEVE REAL INVENTORY CONTEXT
  let products = [];
  let warehouses = [];
  let todaysMovements = [];
  let ledgerEntries = [];

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [prodList, whList, todayLogs, recentLogs] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          stocks: { include: { warehouse: true, location: true } }
        }
      }),
      prisma.warehouse.findMany({
        include: {
          stocks: { include: { product: true } }
        }
      }),
      prisma.stockLedger.findMany({
        where: { createdAt: { gte: todayStart } },
        include: { product: true, warehouse: true, location: true, createdBy: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockLedger.findMany({
        take: 100,
        include: { product: true, warehouse: true, location: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    products = prodList;
    warehouses = whList;
    todaysMovements = todayLogs;
    ledgerEntries = recentLogs;
  } catch (err) {
    console.error('Error fetching database context for AI query', err);
  }

  // Calculate real inventory statistics from database context
  const lowStockItems = [];
  const outOfStockItems = [];
  const runOutSoonItems = [];
  const productOutgoingMap = {};
  const warehouseStockMap = {};

  products.forEach((p) => {
    let totalStock = 0;
    (p.stocks || []).forEach((s) => {
      totalStock += s.quantity || 0;
      const whName = s.warehouse?.name || 'Main Warehouse';
      warehouseStockMap[whName] = (warehouseStockMap[whName] || 0) + (s.quantity || 0);
    });

    const reorder = p.reorderLevel || 10;
    if (totalStock === 0) {
      outOfStockItems.push({ name: p.name, sku: p.sku, stock: 0, reorderLevel: reorder });
    } else if (totalStock <= reorder) {
      lowStockItems.push({ name: p.name, sku: p.sku, stock: totalStock, reorderLevel: reorder });
    } else if (totalStock <= reorder * 1.5) {
      runOutSoonItems.push({ name: p.name, sku: p.sku, stock: totalStock, reorderLevel: reorder });
    }
  });

  ledgerEntries.forEach((l) => {
    if (l.type === 'DELIVERY' || l.type === 'TRANSFER_OUT') {
      const pName = l.product?.name || l.productId;
      productOutgoingMap[pName] = (productOutgoingMap[pName] || 0) + Math.abs(l.quantity);
    }
  });

  // Sort outgoing products
  const topOutgoing = Object.entries(productOutgoingMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  // Sort warehouses by stock
  const topWarehouses = Object.entries(warehouseStockMap)
    .map(([name, stock]) => ({ name, stock }))
    .sort((a, b) => b.stock - a.stock);

  // 2. CHECK IF OPENROUTER OR OPENAI API KEY IS CONFIGURED
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const apiKey = openRouterKey || openAiKey;

  if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey !== 'your_openrouter_api_key_here') {
    try {
      const systemPrompt = `You are StockSense AI, an expert AI Inventory Assistant. You must answer user queries using ONLY the live PostgreSQL inventory data provided below. Never invent or hallucinate numbers or products.

LIVE DATABASE CONTEXT:
- Total Products Evaluated: ${products.length}
- Low Stock Items (${lowStockItems.length}): ${JSON.stringify(lowStockItems)}
- Out of Stock Items (${outOfStockItems.length}): ${JSON.stringify(outOfStockItems)}
- At Risk of Running Out Soon (${runOutSoonItems.length}): ${JSON.stringify(runOutSoonItems)}
- Today's Movements Count (${todaysMovements.length}): ${JSON.stringify(
        todaysMovements.map((m) => ({
          ref: m.referenceId,
          type: m.type,
          product: m.product?.name,
          qty: m.quantity
        }))
      )}
- Warehouse Stock Totals: ${JSON.stringify(topWarehouses)}
- Top Outgoing Products: ${JSON.stringify(topOutgoing)}
`;

      let aiReply = '';
      if (openRouterKey || apiKey.startsWith('sk-or-')) {
        const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
        aiReply = await callOpenRouter(apiKey, model, systemPrompt, userMessage);
      } else {
        aiReply = await callOpenAI(apiKey, systemPrompt, userMessage);
      }

      return {
        reply: aiReply,
        groundedInDatabase: true,
        metrics: {
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          todaysMovementsCount: todaysMovements.length,
          topWarehouse: topWarehouses[0]?.name || 'N/A'
        }
      };
    } catch (apiErr) {
      console.warn('LLM API call failed, falling back to database reasoning engine:', apiErr.message);
    }
  }

  // 3. INTENT-MATCHING DATABASE REASONING ENGINE (100% REAL DATABASE DATA)
  let reply = '';

  if (query.includes('low') || query.includes('reorder') || query.includes('shortage')) {
    if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
      reply = `✅ **Great news!** According to current PostgreSQL records, all **${products.length} products** are fully stocked and above their reorder thresholds. No immediate reorders are required.`;
    } else {
      reply = `⚠️ **Stock Reorder Alert (Live Database Data)**:\n\n`;
      if (outOfStockItems.length > 0) {
        reply += `🚨 **Out of Stock (${outOfStockItems.length} items)**:\n`;
        outOfStockItems.forEach((item) => {
          reply += `• **${item.name}** (${item.sku}) — Current Stock: **0 units** (Reorder Level: ${item.reorderLevel})\n`;
        });
        reply += `\n`;
      }
      if (lowStockItems.length > 0) {
        reply += `📉 **Low Stock (${lowStockItems.length} items)**:\n`;
        lowStockItems.forEach((item) => {
          reply += `• **${item.name}** (${item.sku}) — Current Stock: **${item.stock} units** (Reorder Level: ${item.reorderLevel})\n`;
        });
      }
      reply += `\n💡 *Recommendation*: Create incoming Vendor Receipts for these items immediately to maintain safety stock limits.`;
    }
  } else if (query.includes('today') || query.includes('movement') || query.includes('activity')) {
    if (todaysMovements.length === 0) {
      reply = `📅 **Today's Inventory Activity**:\n\nThere have been **0 stock movements** logged so far today (${new Date().toLocaleDateString()}). Recent activity will display here automatically as receipts, deliveries, transfers, or adjustments are executed.`;
    } else {
      reply = `📅 **Today's Stock Movements (${todaysMovements.length} logged)**:\n\n`;
      todaysMovements.forEach((m) => {
        const change = m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`;
        reply += `• **${m.referenceId}** (${m.type}): **${m.product?.name || 'Product'}** (${change} units) at ${m.warehouse?.name || 'Warehouse'} (By: ${m.createdBy?.name || 'System'})\n`;
      });
    }
  } else if (query.includes('warehouse') || query.includes('location') || query.includes('most stock')) {
    if (topWarehouses.length === 0) {
      reply = `🏢 **Warehouse Stock Summary**:\n\nNo warehouse stock records were found in the database. Please ensure warehouses and storage locations are populated.`;
    } else {
      const topWh = topWarehouses[0];
      reply = `🏢 **Warehouse Stock Distribution (Live Database Ranking)**:\n\n🏆 **Top Warehouse**: **${topWh.name}** holding **${topWh.stock} units** in total stock.\n\n**Full Distribution**:\n`;
      topWarehouses.forEach((wh, idx) => {
        reply += `${idx + 1}. **${wh.name}**: ${wh.stock} total stock units\n`;
      });
    }
  } else if (query.includes('outgoing') || query.includes('ship') || query.includes('highest')) {
    if (topOutgoing.length === 0) {
      reply = `📦 **Outgoing Stock Volume**:\n\nNo outgoing shipments (Deliveries or Transfers Out) have been recorded yet in StockLedger.`;
    } else {
      reply = `📦 **Products with Highest Outgoing Volume**:\n\n`;
      topOutgoing.slice(0, 5).forEach((p, idx) => {
        reply += `${idx + 1}. **${p.name}**: **${p.qty} units** shipped out\n`;
      });
    }
  } else if (query.includes('run out') || query.includes('risk') || query.includes('soon')) {
    const atRisk = [...outOfStockItems, ...lowStockItems, ...runOutSoonItems];
    if (atRisk.length === 0) {
      reply = `🛡️ **Inventory Depletion Forecast**:\n\nAll items currently have healthy stock buffers. None are projected to run out soon based on current reorder thresholds.`;
    } else {
      reply = `⚠️ **Products at Risk of Depletion Soon**:\n\n`;
      atRisk.forEach((p) => {
        reply += `• **${p.name}** (${p.sku}) — Current Stock: **${p.stock} units** (Reorder Level: ${p.reorderLevel})\n`;
      });
      reply += `\n💡 *Action item*: Review replenishment lead times and schedule stock receipts before safety thresholds are breached.`;
    }
  } else {
    // General overview response
    reply = `🤖 **StockSense AI Assistant Summary (Live DB Overview)**:\n\n`;
    reply += `• **Total Products Analyzed**: ${products.length}\n`;
    reply += `• **Low Stock Items**: ${lowStockItems.length}\n`;
    reply += `• **Out of Stock Items**: ${outOfStockItems.length}\n`;
    reply += `• **Today's Movements Logged**: ${todaysMovements.length}\n`;
    reply += `• **Primary Warehouse**: ${topWarehouses[0]?.name || 'Main Warehouse'} (${topWarehouses[0]?.stock || 0} units)\n\n`;
    reply += `You can ask me specific questions like:\n- *"Which products are low in stock?"*\n- *"Which products should I reorder?"*\n- *"Show me today's stock movements."*\n- *"Which warehouse has the most stock?"*\n- *"Which products have the highest outgoing quantity?"*`;
  }

  return {
    reply,
    groundedInDatabase: true,
    metrics: {
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      todaysMovementsCount: todaysMovements.length,
      topWarehouse: topWarehouses[0]?.name || 'Main Warehouse'
    }
  };
};

function callOpenAI(apiKey, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0]?.message?.content) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error(parsed.error?.message || 'OpenAI API returned empty response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function callOpenRouter(apiKey, model, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model || 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'StockSense AI Assistant',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0]?.message?.content) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error(parsed.error?.message || 'OpenRouter API returned empty response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}
