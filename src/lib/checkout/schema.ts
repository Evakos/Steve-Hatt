import { z } from "zod";

export const checkoutItemSchema = z.object({
  wooProductId: z.number().int().positive(),
  wooVariationId: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
  weight: z.number().nonnegative().default(0),
  preparation: z.string(),
  productName: z.string().min(1),
});

export const checkoutRequestSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  fulfilment: z.object({
    type: z.enum(["delivery", "collection"]),
    slot: z.object({
      date: z.string(),
      label: z.string(),
      isChristmas: z.boolean(),
    }),
    postcode: z.string().optional(),
  }),
  customer: z.object({
    email: z.email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(1),
    address: z
      .object({
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        postcode: z.string(),
      })
      .optional(),
  }),
  payment: z.object({
    token: z.string().min(1),
  }),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// The confirm step happens after a 3DS redirect/challenge round-trip. This project has no
// database (see master plan, Phase C3 "known gap"), so there's nowhere server-side to stash
// the original checkout details between the initial /api/checkout call and this confirmation —
// the client resends the full original request alongside the 3DS result.
export const confirmRequestSchema = z.object({
  transactionId: z.string().min(1),
  orderRef: z.string().min(1),
  threeDSResponse: z.unknown(),
  checkout: checkoutRequestSchema,
});

export type ConfirmRequest = z.infer<typeof confirmRequestSchema>;
