import { Readable } from "stream";

type DocumentType = "invoice" | "quote";

interface EmailOptions {
  to: string;
  documentType: string;
  documentId: string;
  message: string;
  email: string;
  pdfStream?: Readable;
}
