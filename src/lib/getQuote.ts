import { sendText } from "@/lib/sendText";
import { stripeConfig, isValidStripeQuoteId, ROOT_URL } from "@/lib/utl";
import Stripe from "stripe";

export const getQuote = async (key: string, id: string) => {
  const stripe = stripeConfig;

  // Replace with a valid quote ID

  const isIDValid = isValidStripeQuoteId(id);
  if (isIDValid !== true) {
    console.log("ID Error");
    return {
      notFound: true,
    };
  }
  const quote = await stripe.quotes.retrieve(id, {
    expand: ["line_items"],
  });
  // if Key Doesn't match drop request

  const quoteKEY = quote.metadata.key;

  if (quoteKEY != key) {
    return {
      notFound: true,
    };
  }

  const customer = (await stripe.customers.retrieve(
    quote.customer as string
  )) as Stripe.Customer;

  if (!customer) {
    console.log("Customer not found");
    return {
      notFound: true,
    };
  }

  const pdf = await stripe.quotes.pdf(id);

  if (!pdf) {
    console.log("PDF Error");
    return {
      notFound: true,
    };
  }

  if (typeof customer.name == "string") {
    const body = `${customer.name} has opened quote for ${quote.header}`;
    const MSG = await sendText(body, process.env.MASTERPHONE!);
  }

  const link = `${ROOT_URL}/api/invoices/quote/${quoteKEY}/${id}`;
  return {
    id: quote.id,
    customer: customer.name,
    header: quote.header,
    amount_total: quote.amount_total,
    line_items: quote.line_items,
    description: quote.description,
    pdf: link,
    quote: quote,
  };
};
