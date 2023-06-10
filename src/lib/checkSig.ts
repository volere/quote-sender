export const isValidStripeInvoiceId = (invoiceId: string) => {
  // Stripe invoice IDs start with 'in_' followed by 24 alphanumeric characters
  const regex = /^in_[a-zA-Z0-9]{24}$/;
  return regex.test(invoiceId);
};
