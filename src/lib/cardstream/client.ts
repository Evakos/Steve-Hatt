import "server-only";
import { getServerEnv } from "@/lib/env";
import { mockCardstreamClient } from "./mock-client";
import { realCardstreamClient } from "./real-client";
import type { CardstreamClient } from "./types";

export type {
  CardstreamClient,
  AuthoriseSaleInput,
  AuthoriseSaleResult,
  ConfirmThreeDSInput,
  ConfirmThreeDSResult,
  CaptureSaleInput,
  CaptureSaleResult,
  RefundSaleInput,
  RefundSaleResult,
  VerifyCardInput,
  VerifyCardResult,
  AuthoriseSaleWithTokenInput,
  AuthoriseSaleWithTokenResult,
} from "./types";

export function getCardstreamClient(): CardstreamClient {
  return getServerEnv().CARDSTREAM_MOCK ? mockCardstreamClient : realCardstreamClient;
}
