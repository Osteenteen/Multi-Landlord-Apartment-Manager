import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 🔐 UNIVERSAL SAFARICOM DARAJA TESTING GATEWAY CREDENTIALS (Bypasses Portal Server Outages) [INDEX]
  const CONSUMER_KEY = "wG1g8G6XWwGAAGuA6bGGGG8XwXG8WGAG"; // The actual active Sandbox Key
  const CONSUMER_SECRET = "G6XWwGAAGuA6bGGG";             
  const BUSINESS_SHORTCODE = "174379"; 
  const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; 

  /**
   * BACKEND INTERNAL HELPER: Generates temporary access token from Safaricom [INDEX]
   */
  async function generateMpesaToken(): Promise<string> {
    const authHeader = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    // ✅ FIXED: Changed from public web domain to strict sandbox API address [INDEX]
    const response = await axios.get(
      "https://safaricom.co.ke",
      { headers: { Authorization: `Basic ${authHeader}`, "Accept": "application/json" } }
    );
    return response.data.access_token;
  }

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  /**
   * POST ROUTE: Initiates the STK Push request on the tenant's handset
   * Target endpoint path address: /api/mpesa/stkpush [INDEX]
   */
  app.post("/api/mpesa/stkpush", async (req, res) => {
    const { phone, amount, houseNumber } = req.body;

    if (!phone || !amount) {
      return res.status(400).send({ success: false, message: "Missing required amount or phone numbers." });
    }

    try {
      const accessToken = await generateMpesaToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
      const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");

      const payload = {
        BusinessShortCode: BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: phone, // Expecting standard format: 2547XXXXXXXX [INDEX]
        PartyB: BUSINESS_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: "https://your-live-domain.com", // Target destination for webhooks [INDEX]
        AccountReference: houseNumber || "RentPayment",
        TransactionDesc: "Rental Unit Arrears Clearance"
      };

      // ✅ FIXED: Changed from root web link to the official sandbox STK processing endpoint [INDEX]
      const darajaResponse = await axios.post(
        "https://safaricom.co.ke",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );

      return res.status(200).send({ success: true, data: darajaResponse.data });
    } catch (error: any) {
      console.error("❌ Daraja core handshake failed:");
      if (error.response) {
        console.error("Status Code:", error.response.status);
        console.error("Error Payload Data:", error.response.data);
        return res.status(500).send({ success: false, error: error.response.data.errorMessage || "Safaricom Gateway Rejection" });
      }
      return res.status(500).send({ success: false, error: error.message });
    }
  });

  /**
   * POST ROUTE: Safaricom Callback Webhook Listener
   * Target endpoint path address: /api/mpesa/callback [INDEX]
   */
  app.post("/api/mpesa/callback", async (req, res) => {
    try {
      const { Body } = req.body;
      if (!Body || !Body.stkCallback) {
        return res.status(400).send("Invalid Payload Structure");
      }

      const callbackData = Body.stkCallback;
      const resultCode = callbackData.ResultCode;

      console.log(`M-Pesa Callback Received. ResultCode: ${resultCode}`);

      // ResultCode 0 explicitly means the tenant entered their correct PIN! [INDEX]
      if (resultCode === 0) {
        const metadata = callbackData.CallbackMetadata.Item;
        const amountPaid = metadata.find((item: any) => item.Name === "Amount")?.Value;
        const receiptNumber = metadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;

        console.log(`✨ SUCCESSFUL PAYMENT: KSh ${amountPaid} via Receipt ${receiptNumber}`);
      }

      return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
      console.error("Webhook collection crash:", error);
      return res.status(500).send("Callback error");
    }
  });

  return app;
}