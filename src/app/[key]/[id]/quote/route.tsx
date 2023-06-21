// pages/quote/[key]/[id].tsx

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  VStack,
  Text,
  Spinner,
  Table,
  TableCaption,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  HStack,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { GetServerSideProps } from "next";
// import { loadStripe, Stripe } from '@stripe/stripe-js';
import * as React from "react";
import Stripe from "stripe";
import { sendText } from "@/lib/sendText";
import { stripeConfig, isValidStripeQuoteId, ROOT_URL } from "@/lib/utl";

type Quote = {
  id: string;
  customer: string;
  pdf: string;
  amount_total: number;
  line_items: {
    data: [
      {
        description?: String;
        price: { unit_amount_decimal: string };
        quantity: number;
      }
    ];
  };
  description?: string;
  header?: string;
};

type QuotePageProps = {
  quote: Quote;
};

const QuotePage = ({ quote }: QuotePageProps) => {
  const handleDownloadClick = () => {
    window.open(quote.pdf, "_blank");
  };

  const displayLineItems = () => {
    if (!quote) {
      return (
        <Box textAlign="center">
          <Spinner />
          <Text>Loading line items...</Text>
        </Box>
      );
    }

    return (
      <Table variant="simple">
        <TableCaption>
          {" "}
          <Box>
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="blue"
              onClick={handleDownloadClick}
            >
              Download Quote
            </Button>
          </Box>
        </TableCaption>
        <Thead>
          {" "}
          <VStack spacing={4} align="start">
            <Heading as="h1" size="lg">
              <strong>{quote.customer} </strong>
            </Heading>
            <Text>
              <strong>Total Price:</strong> {quote.amount_total}
            </Text>
          </VStack>
          <br /> <br />
          <Tr>
            <Th>Description</Th>
            <Th>Price</Th>
            <Th>Quantity</Th>
            <Th>Total</Th>
          </Tr>
        </Thead>
        <Tbody>
          {quote.line_items.data.map((item, index) => (
            <Tr key={index}>
              <Td>{item.description}</Td>
              <Td>
                ${(Number(item.price.unit_amount_decimal) / 100).toFixed(2)}
              </Td>
              <Td>{item.quantity}</Td>
              <Td>
                $
                {(
                  (Number(item.price.unit_amount_decimal) / 100) *
                  item.quantity
                ).toFixed(2)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  return (
    <>
      <Container>
        {" "}
        <HStack spacing={83} align="start" width={"100%"}>
          <Heading as="h2" size="lg">
            Quote Details
          </Heading>
        </HStack>
      </Container>
      <VStack spacing={4} align="start" width="100%">
        {quote && (
          <Heading as="h1" size="lg">
            {quote.header}
          </Heading>
        )}
        {quote && <Text>{quote.description}</Text>}
        {displayLineItems()}
      </VStack>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const stripe = stripeConfig;

  const {
    query: { key, id },
  } = context;
  // Replace with a valid quote ID

  const quoteID = `qt_${id}`;
  const isIDValid = isValidStripeQuoteId(quoteID);
  if (isIDValid !== true) {
    console.log("ID Error");
    return {
      notFound: true,
    };
  }
  const quote = await stripe.quotes.retrieve(quoteID, {
    expand: ["line_items"],
  });
  // if Key Doesn't match drop request

  const quoteKEY = quote.metadata.key;

  if (quoteKEY != key) {
    console.log("key:  ", key);
    console.log("Key  quote", quote.metadata.key);
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

  const pdf = await stripe.quotes.pdf(quoteID);

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
    props: {
      quote: {
        id: quote.id,
        customer: customer.name,
        header: quote.header,
        amount_total: quote.amount_total,
        line_items: quote.line_items,
        description: quote.description,
        pdf: link,
        quote: quote,
      },
    },
  };
};

export default QuotePage;
