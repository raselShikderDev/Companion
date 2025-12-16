/** biome-ignore-all lint/style/useImportType: > */
import { MatchStatus } from "@prisma/client";

export interface CreateMatchInput {
  recipientId: string; // explorer.id of the recipient
}

export interface UpdateMatchStatusInput {
  status: MatchStatus;
}

// requestorId // Creator
// receiptid // accept