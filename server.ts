import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Logger middleware for easier debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Simulated/Mock Xendit data for local/preview environments without API Key
let mockBalance = 24580000; // in IDR (approx $1500 USD)
const mockTransactions = [
  {
    id: "txn_xnd001",
    product_id: "prod_pay_01",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: "OVO",
    channel_category: "EWALLET",
    amount: 150000,
    currency: "IDR",
    reference: "REF-20260701-9921",
    created: "2026-07-06T15:30:00.000Z",
    updated: "2026-07-06T15:32:00.000Z",
    description: "In-store QR payment at Coffee House"
  },
  {
    id: "txn_xnd002",
    product_id: "prod_pay_02",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: "MANDIRI",
    channel_category: "BANK",
    amount: 2500000,
    currency: "IDR",
    reference: "REF-20260703-1250",
    created: "2026-07-05T09:15:00.000Z",
    updated: "2026-07-05T09:15:45.000Z",
    description: "Freelance web design service invoice #25"
  },
  {
    id: "txn_xnd003",
    product_id: "prod_pay_03",
    type: "PAYMENT",
    status: "PENDING",
    channel_code: "SHOPEEPAY",
    channel_category: "EWALLET",
    amount: 75000,
    currency: "IDR",
    reference: "REF-20260705-4310",
    created: "2026-07-04T18:22:00.000Z",
    updated: "2026-07-04T18:22:00.000Z",
    description: "Online checkout transaction for custom sticker pack"
  },
  {
    id: "txn_xnd004",
    product_id: "prod_rem_01",
    type: "OUTWARD_REMITTANCE",
    status: "SUCCESS",
    channel_code: "BCA",
    channel_category: "BANK",
    amount: 1200000,
    currency: "IDR",
    reference: "REF-20260705-0091",
    created: "2026-07-04T11:45:00.000Z",
    updated: "2026-07-04T11:48:12.000Z",
    description: "Payout to remote graphics contractor"
  },
  {
    id: "txn_xnd005",
    product_id: "prod_pay_04",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: "QRIS",
    channel_category: "QR_CODE",
    amount: 450000,
    currency: "IDR",
    reference: "REF-20260706-0812",
    created: "2026-07-03T14:10:00.000Z",
    updated: "2026-07-03T14:10:15.000Z",
    description: "Merchandise sales at summer popup store"
  },
  {
    id: "txn_xnd006",
    product_id: "prod_pay_05",
    type: "PAYMENT",
    status: "FAILED",
    channel_code: "BNI",
    channel_category: "BANK",
    amount: 1250000,
    currency: "IDR",
    reference: "REF-20260706-5541",
    created: "2026-07-02T10:05:00.000Z",
    updated: "2026-07-02T10:10:00.000Z",
    description: "Failed checkout payment - insufficient funds"
  },
  {
    id: "txn_xnd007",
    product_id: "prod_pay_06",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: "GOPAY",
    channel_category: "EWALLET",
    amount: 89000,
    currency: "IDR",
    reference: "REF-20260707-1110",
    created: "2026-07-01T20:45:00.000Z",
    updated: "2026-07-01T20:45:10.000Z",
    description: "E-book store digital checkout purchase"
  },
  {
    id: "txn_xnd008",
    product_id: "prod_pay_07",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: "BRI",
    channel_category: "BANK",
    amount: 850000,
    currency: "IDR",
    reference: "REF-20260708-3329",
    created: "2026-06-30T11:20:00.000Z",
    updated: "2026-06-30T11:21:00.000Z",
    description: "Consulting advisory fee invoice #4"
  },
  {
    id: "txn_xnd009",
    product_id: "prod_rem_02",
    type: "OUTWARD_REMITTANCE",
    status: "SUCCESS",
    channel_code: "MANDIRI",
    channel_category: "BANK",
    amount: 500000,
    currency: "IDR",
    reference: "REF-20260630-1011",
    created: "2026-06-29T16:00:00.000Z",
    updated: "2026-06-29T16:05:00.000Z",
    description: "Refund to customer for cancelled service booking"
  },
  {
    id: "txn_xnd010",
    product_id: "prod_pay_08",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: "QRIS",
    channel_category: "QR_CODE",
    amount: 120000,
    currency: "IDR",
    reference: "REF-20260628-9942",
    created: "2026-06-28T13:40:00.000Z",
    updated: "2026-06-28T13:40:12.000Z",
    description: "Donation received for charity bake sale"
  }
];

// Endpoint to check configuration status
app.get("/api/xendit/status", (req, res) => {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  res.json({
    configured: !!(secretKey && secretKey.trim().length > 0)
  });
});

// Endpoint to fetch Xendit Balance
app.get("/api/xendit/balance", async (req, res) => {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey || secretKey.trim().length === 0) {
    // Return mock balance with metadata indicating simulation mode
    return res.json({
      balance: mockBalance,
      currency: "IDR",
      mode: "simulated",
      account_type: "CASH"
    });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
    const response = await fetch("https://api.xendit.co/balance?account_type=CASH", {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Xendit API error:", errText);
      throw new Error(`Xendit API returned status ${response.status}`);
    }

    const data = await response.json();
    return res.json({
      balance: data.balance,
      currency: data.currency || "IDR",
      mode: "live",
      account_type: data.account_type || "CASH"
    });
  } catch (error: any) {
    console.error("Failed to fetch balance from Xendit live API:", error.message);
    // Graceful fallback to simulated balance if the key is invalid or request fails
    return res.json({
      balance: mockBalance,
      currency: "IDR",
      mode: "fallback",
      error: error.message,
      account_type: "CASH"
    });
  }
});

// Endpoint to fetch and filter/search Xendit Transactions
app.get("/api/xendit/transactions", async (req, res) => {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  const { search, type, status, limit } = req.query;

  // We filter simulated data locally
  const getFilteredMockData = () => {
    let list = [...mockTransactions];

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          t.channel_code.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }

    if (type && type !== "ALL") {
      list = list.filter((t) => t.type === type);
    }

    if (status && status !== "ALL") {
      list = list.filter((t) => t.status === status);
    }

    const limitNum = limit ? parseInt(String(limit), 10) : 50;
    return list.slice(0, limitNum);
  };

  if (!secretKey || secretKey.trim().length === 0) {
    return res.json({
      data: getFilteredMockData(),
      mode: "simulated"
    });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
    // Fetch live transactions. We will retrieve a generous limit (e.g. 100) and filter or paginate them.
    const url = new URL("https://api.xendit.co/transactions");
    url.searchParams.append("limit", "100");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Xendit Transactions API error:", errText);
      throw new Error(`Xendit API returned status ${response.status}`);
    }

    const result = await response.json();
    let dataList = result.data || [];

    // Filter by type if provided (Note: Xendit natively supports types parameter but can be filtered here for reliability)
    if (type && type !== "ALL") {
      dataList = dataList.filter((t: any) => t.type === type);
    }

    // Filter by status if provided
    if (status && status !== "ALL") {
      dataList = dataList.filter((t: any) => t.status === status);
    }

    // Filter by text search if provided
    if (search) {
      const q = String(search).toLowerCase();
      dataList = dataList.filter(
        (t: any) =>
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.reference && t.reference.toLowerCase().includes(q)) ||
          (t.channel_code && t.channel_code.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q)
      );
    }

    const limitNum = limit ? parseInt(String(limit), 10) : 50;
    return res.json({
      data: dataList.slice(0, limitNum),
      mode: "live"
    });
  } catch (error: any) {
    console.error("Failed to fetch transactions from Xendit live API:", error.message);
    // Graceful fallback to mock data on live error
    return res.json({
      data: getFilteredMockData(),
      mode: "fallback",
      error: error.message
    });
  }
});

// Endpoint to post a new manual simulation transaction to Xendit's mock state
// (This is useful to allow live interaction with "online money" in the iframe!)
app.post("/api/xendit/simulate-incoming", (req, res) => {
  const { amount, description, channel_code, channel_category } = req.body;
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const newTxn = {
    id: `txn_sim_${Math.random().toString(36).substring(2, 9)}`,
    product_id: "prod_sim_pay",
    type: "PAYMENT",
    status: "SUCCESS",
    channel_code: channel_code || "QRIS",
    channel_category: channel_category || "QR_CODE",
    amount: parsedAmount,
    currency: "IDR",
    reference: `SIM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    description: description || "Simulated online incoming payment"
  };

  // Prepend to transaction list
  mockTransactions.unshift(newTxn);
  
  // Increase mock balance
  mockBalance += parsedAmount;

  res.json({
    success: true,
    transaction: newTxn,
    newBalance: mockBalance
  });
});

// Implement Vite or Static Middleware
const isProd = process.env.NODE_ENV === "production";
if (!isProd) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development full-stack server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start Vite server:", err);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Note: in Express v4, use app.get("*", ...), in v5, use app.get("*all", ...)
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production full-stack server running on http://localhost:${PORT}`);
  });
}
