import Stripe from "stripe";

export const stripeConfig = new Stripe(process.env.STRIPE as string, {
  // https://github.com/stripe/stripe-node#configuration

  //@ts-ignore "2022-08-01"
  apiVersion: null,
});

export const isValidStripeQuoteId = (quoteId: string) => {
  // Stripe quote IDs start with 'qt_' followed by 24 alphanumeric characters
  const regex = /^qt_[a-zA-Z0-9]{24}$/;
  return regex.test(quoteId);
};
export const ROOT_URL =
  process.env.VERCEL_ENV == "development"
    ? `${process.env.VERCEL_URL}`
    : `https://${process.env.URL}`;
