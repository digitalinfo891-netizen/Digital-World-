
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentForm from "./PaymentForm";

export const instant = false;

const PRICE_KEY = "LIFETIME_MEMBERSHIP_PRICE_INR";
const ENABLED_KEY = "LIFETIME_MEMBERSHIP_ENABLED";

export default async function PaymentPage() {
  const user = await requireUser();

  const [
    entitlement,
    latestPayment,
    priceSetting,
    enabledSetting,
  ] = await Promise.all([
    prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        payment: {
          is: {
            status: "CONFIRMED",
            purpose: "LIFETIME_MEMBERSHIP",
          },
        },
      },
      select: { id: true },
    }),

    prisma.payment.findFirst({
      where: {
        userId: user.id,
        purpose: "LIFETIME_MEMBERSHIP",
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
      },
    }),

    prisma.platformSetting.findUnique({
      where: { key: PRICE_KEY },
      select: { value: true },
    }),

    prisma.platformSetting.findUnique({
      where: { key: ENABLED_KEY },
      select: { value: true },
    }),
  ]);

  const configuredPrice = priceSetting?.value;
  const membershipPriceInr =
    typeof configuredPrice === "number" &&
    Number.isFinite(configuredPrice) &&
    configuredPrice > 0
      ? configuredPrice
      : null;

  const membershipEnabled = enabledSetting?.value === true;

  return (
    <PaymentForm
      hasAccess={Boolean(entitlement)}
      membershipPriceInr={membershipPriceInr}
      membershipEnabled={membershipEnabled}
      initialPayment={
        latestPayment
          ? {
              id: latestPayment.id,
              amount: latestPayment.amount.toString(),
              currency: latestPayment.currency,
              status: latestPayment.status,
            }
          : null
      }
    />
  );
}
