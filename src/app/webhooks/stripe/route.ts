import { ROOT_URL, stripeConfig } from "@/lib/utl";
import { v4 as uuidv4 } from "uuid";
import { buffer } from "micro";

import Cors from "micro-cors";
import { sendText } from "@/lib/sendText";
import { ErrorHandler } from "@/lib/ErrorHandler";

import { sendEmailWithDocumentLink } from "@/lib/nodemailer";
import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";

const webhookSecret = process.env.NEW_STRIPEHOOK as string;

//  https://stripe.com/docs/api/events/types
const stripe = stripeConfig;

export const config = {
  api: {
    bodyParser: false,
  },
};

const cors: any = Cors({
  allowMethods: ["POST", "HEAD"],
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    if (!sig) return res.status(400).send("No sig");
    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        webhookSecret
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      // On error, log and return the error message.
      if (err! instanceof Error) console.log(err);
      console.log(`❌ Error message: ${errorMessage}`);
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    // Successfully constructed event.
    console.log("✅ Success:", event.id);

    switch (event.type) {
      case "quote.finalized":
        try {
          const quote = event.data.object as Stripe.Quote;
          const quoteHeader =
            typeof quote.header === "string" ? quote.header : "you";
          const customer = (await stripe.customers.retrieve(
            quote.customer as string
          )) as Stripe.Customer;

          // Check if customer phone number is available
          if (!customer.phone) {
            console.log("Customer phone number not found");
          }

          const uniqueToken = uuidv4();
          const addKey = await stripe.quotes.update(quote.id, {
            metadata: {
              key: uniqueToken,
            },
          });

          // Generate the quote link
          const link = `${ROOT_URL}/${uniqueToken}/${quote.id}/quote`;

          const quoteMessage = `Hello ${customer.name}, we have prepared a customized quote for your ${quoteHeader} project. Please don't hesitate to ask any questions or share your concerns. You can review the quote here: ${link}`;
          // Send quote via email

          const quoteemail = `<p>Hello ${customer.name},</p>
              <p>We have prepared a customized quote for your ${quoteHeader} project. Please don't hesitate to ask any questions or share your concerns. You can review the quote by clicking the button below:</p>
              <p><a href="${link}" style="background-color: #4CAF50; border: none; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 8px;">View Quote</a></p>
              <p>Thank you for considering us for your project.</p>
              <p>Best regards,</p>`;

          const options = {
            to: customer.email as string,
            documentType: "quote",
            documentId: quote.id as string,
            message: quoteMessage,
            email: quoteemail,
          };
          const emailQuote = await sendEmailWithDocumentLink(options, link);
          // Send the quote message via text
          const sentQuote = await sendText(
            quoteMessage,
            customer.phone as string
          );
          return res.json({
            message: sentQuote,
            email: emailQuote,
            updateKey: addKey,
          });
        } catch (err) {
          console.error(err);
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          return res.status(400).send(`Error: ${errorMessage}`);
        }

      default:
        console.warn(`Unhandled event type ${event.type}`);
        return res.json({ message: `Unhandled event type ${event.type}` });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default cors(handler as any);
