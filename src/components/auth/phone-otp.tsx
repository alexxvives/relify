"use client";

import { useState } from "react";
import { OtpInput } from "@/components/arc/otp-input/otp-input";
import { features } from "@/lib/features";

/**
 * SMS code box under the phone field. Hidden while features.phoneOtp is off: there is no SMS
 * provider yet, so nothing is sent and nothing is checked server-side.
 */
export function PhoneOtp({ phone, enabled = features.phoneOtp }: { phone: string; enabled?: boolean }) {
  const [code, setCode] = useState("");

  if (!enabled) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#e6e9f0] bg-[#f8fafc] p-4">
      <OtpInput
        label="Código de verificación"
        description={phone ? `Escribe el código de 6 cifras que hemos enviado por SMS al ${phone}.` : "Escribe el código de 6 cifras que te enviaremos por SMS."}
        value={code}
        onChange={setCode}
      />
      <button type="button" className="w-fit text-sm font-medium text-[#0c7c78] hover:underline">
        Reenviar código
      </button>
    </div>
  );
}
