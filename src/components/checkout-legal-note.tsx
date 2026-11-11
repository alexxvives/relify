import Link from "next/link";
import { billingCopy } from "@/lib/billing-copy";

export function CheckoutLegalNote() {
  return (
    <p className="text-xs leading-5 text-[#8b95a7]">
      {billingCopy.legalCheckoutLead}{" "}
      <Link href="/terminos" className="font-medium text-[#465ab4] underline-offset-2 hover:underline">
        {billingCopy.legalTermsLink}
      </Link>{" "}
      {billingCopy.legalCheckoutAnd}{" "}
      <Link href="/privacidad" className="font-medium text-[#465ab4] underline-offset-2 hover:underline">
        {billingCopy.legalPrivacyLink}
      </Link>
      .
    </p>
  );
}
