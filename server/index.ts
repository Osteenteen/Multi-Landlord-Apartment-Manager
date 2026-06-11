import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import { handleDemo } from "./routes/demo";
import { db } from "./firebase"; 

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 🔐 UNIVERSAL SAFARICOM DARAJA TESTING GATEWAY CREDENTIALS
  const CONSUMER_KEY = "RXodJsaeVXvPV2Y8mG8DMiA0ARAuMrKZMx4BhJOBJ2ziAg7v"; 
  const CONSUMER_SECRET = "nGFTmPt9D2DKT6KSTxxCwjdmKcnbisNdrPzon1A24Ji7HHJMGimJisGMPiEJtcG7";             
  const BUSINESS_SHORTCODE = "174379"; 
  const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; 
  
  // 🔗 YOUR ACTIVE LOCALTUNNEL Webhook DOMAIN (Ensure NO trailing slash '/')
  const CALLBACK_URL = "https://green-items-drive.loca.lt";

  /**
   * BACKEND INTERNAL HELPER: Generates temporary access token from Safaricom
   */
  async function generateMpesaToken(): Promise<string> {
    const authHeader = Buffer.from(`${CONSUMER_KEY.trim()}:${CONSUMER_SECRET.trim()}`).toString("base64");
    
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${authHeader.trim()}`, "Accept": "application/json" } }
    );
    return response.data.access_token.trim();
  }

  // Basic API test routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  /**
   * POST ROUTE: Initiates the STK Push request on the tenant's handset
   */
  app.post("/api/mpesa/stkpush", async (req, res) => {
    let { phone, amount, houseNumber, tenantId, apartmentId } = req.body;

    if (!phone || !amount) {
      return res.status(400).send({ success: false, message: "Missing required amount or phone numbers." });
    }

    try {
      let formattedPhone = phone.trim().replace(/\+/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = `254${formattedPhone.slice(1)}`;
      }

      // Force type convert payload amount to a clean integer number primitive
      const cleanAmount = Math.floor(Number(amount));

      const accessToken = await generateMpesaToken();

      // 🕒 AIRTIGHT EAST AFRICAN TIME (UTC+3) EXTRACTION VIA LOCALE OBJECTS
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      let hour = parts.find((p) => p.type === "hour")?.value;
      const minute = parts.find((p) => p.type === "minute")?.value;
      const second = parts.find((p) => p.type === "second")?.value;

      // Ensure hours format handles edge 24-hour midnight rewrites safely
      if (hour === "24") hour = "00";

      const timestamp = `${year}${month}${day}${hour}${minute}${second}`;
      const password = Buffer.from(`${BUSINESS_SHORTCODE.trim()}${PASSKEY.trim()}${timestamp}`).toString("base64");

      // Strict Alphanumeric Account Reference construction (drops spaces, slashes, hyphens)
      let safeAccountRef = "RentPayment";
      if (houseNumber) {
        safeAccountRef = houseNumber.toString().replace(/[^a-zA-Z0-9]/g, "").substring(0, 12);
      }
      if (!safeAccountRef || safeAccountRef.trim() === "") {
        safeAccountRef = "RentPayment";
      }

      const payload = {
        BusinessShortCode: BUSINESS_SHORTCODE.trim(),
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline", 
        Amount: cleanAmount,
        PartyA: formattedPhone, 
        PartyB: BUSINESS_SHORTCODE.trim(), 
        PhoneNumber: formattedPhone,
        CallBackURL: `${CALLBACK_URL}/api/mpesa/callback`, 
        AccountReference: safeAccountRef, 
        TransactionDesc: "Rental Unit Arrears Clearance"
      };

      console.log("🚀 Dispatched Payload to Safaricom Sandbox:", JSON.stringify(payload, null, 2));

      const darajaResponse = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );

      const { CheckoutRequestID } = darajaResponse.data;

      // Stash configuration metadata securely to look up when Safaricom sends back the callback hooks
      if (CheckoutRequestID) {
        await db.collection("mpesa_tracking").doc(CheckoutRequestID).set({
          status: "Pending",
          amount: cleanAmount,
          createdAt: new Date().toISOString(),
          tenantId: tenantId || "",
          apartmentId: apartmentId || "",
          houseNumber: safeAccountRef,
          phone: "+" + formattedPhone
        });
      }

      return res.status(200).send({ success: true, data: darajaResponse.data });
    } catch (error: any) {
      console.error("❌ Daraja core handshake failed:");
      if (error.response) {
        console.error("Status Code:", error.response.status);
        console.error("Error Payload Data:", JSON.stringify(error.response.data, null, 2));
        return res.status(400).send({ success: false, error: error.response.data.errorMessage || "Safaricom Gateway Rejection" });
      }
      return res.status(500).send({ success: false, error: error.message });
    }
  });

  /**
   * POST ROUTE: Safaricom Callback Webhook Listener
   */
  app.post("/api/mpesa/callback", async (req, res) => {
    try {
      const { Body } = req.body;
      if (!Body || !Body.stkCallback) {
        return res.status(400).send("Invalid Payload Structure");
      }

      const callbackData = Body.stkCallback;
      const resultCode = callbackData.ResultCode;
      const checkoutRequestID = callbackData.CheckoutRequestID;

      console.log(`M-Pesa Callback Received for ${checkoutRequestID}. ResultCode: ${resultCode}`);

      // Retrieve user tracking contexts we stashed during checkout initialization steps
      const trackingSnap = await db.collection("mpesa_tracking").doc(checkoutRequestID).get();
      const meta = trackingSnap.exists ? trackingSnap.data() : null;

      if (resultCode === 0) {
        const metadata = callbackData.CallbackMetadata.Item;
        const amountPaid = metadata.find((item: any) => item.Name === "Amount")?.Value;
        const receiptNumber = metadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;

        console.log(`✨ SUCCESSFUL PAYMENT: KSh ${amountPaid} via Receipt ${receiptNumber}`);

        // 1. Mark tracking document status as complete
        await db.collection("mpesa_tracking").doc(checkoutRequestID).update({
          status: "Completed",
          mpesaReceipt: receiptNumber,
          updatedAt: new Date().toISOString()
        });

        // 2. Perform secure write operations bypassing client rules restrictions
        if (meta && meta.tenantId) {
          const tenantRef = db.collection("users").doc(meta.tenantId);
          const tenantSnap = await tenantRef.get();

          if (tenantSnap.exists) {
            const currentBalance = Number(tenantSnap.data()?.balance || 0);
            const newBalance = currentBalance - Number(amountPaid);
            
            // Reconcile user balance parameters
            await tenantRef.update({
              balance: newBalance >= 0 ? newBalance : 0
            });

            // Log persistent item analytics into master payment collections
            await db.collection("payments").add({
              tenantId: meta.tenantId,
              associatedApartmentId: meta.apartmentId || "",
              tenantName: tenantSnap.data()?.name || "Valued Tenant",
              houseNumber: meta.houseNumber || "",
              amountPaid: Number(amountPaid),
              mpesaLine: meta.phone || "",
              timestamp: new Date().toISOString(),
              status: "Completed",
              mpesaReceiptNumber: receiptNumber,
              paymentType: "mpesa"
            });

            // Create notification payload record feeds for the tenant
            await db.collection("notifications").add({
              recipientId: meta.tenantId,
              title: "Payment Received Successfully",
              message: `Your payment of KSh ${Number(amountPaid).toLocaleString()} has been cleared! Receipt No: ${receiptNumber}.`,
              type: "payment",
              read: false,
              timestamp: new Date().toISOString()
            });

            // Create alert record notifications feeds for the apartment landlord
            const landlordId = tenantSnap.data()?.landlordId;
            if (landlordId) {
              await db.collection("notifications").add({
                recipientId: landlordId,
                title: "Rent Payment Received",
                message: `${tenantSnap.data()?.name || "Tenant"} (Unit ${meta.houseNumber}) has paid KSh ${Number(amountPaid).toLocaleString()} via M-Pesa.`,
                type: "payment",
                read: false,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } else {
        console.log(`❌ PAYMENT FAILED OR CANCELLED. Description: ${callbackData.ResultDesc}`);

        await db.collection("mpesa_tracking").doc(checkoutRequestID).update({
          status: "Failed",
          reason: callbackData.ResultDesc,
          updatedAt: new Date().toISOString()
        });
      }

      return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
      console.error("Webhook collection crash:", error);
      return res.status(500).send("Callback error");
    }
  });

  return app;
}