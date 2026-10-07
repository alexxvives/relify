"use client";

import { useState } from "react";
import { useActionState } from "react";
import { BadgeEuro, Briefcase, Building2 } from "lucide-react";
import { signOutAction } from "@/app/cuenta/actions";
import { onboardingAction, type OnboardingState } from "@/app/onboarding/actions";
import { PhoneField } from "@/components/phone-field";
import { Button } from "@/components/ui/button";
import { authCopy } from "@/lib/auth-copy";
import { referralSources, signupRoles, splitAccountName, type ReferralSource, type SignupRole } from "@/lib/auth-input";
import { isValidPhoneNational } from "@/lib/phone-countries";
import { isValidSpanishCif } from "@/lib/spanish-cif";

const roleIcons = {
  seller: Building2,
  investor: BadgeEuro,
  advisor: Briefcase,
} as const;

type OnboardingStep = "role" | "identity" | "referral";

const stepNumber: Record<OnboardingStep, number> = {
  role: 1,
  identity: 2,
  referral: 3,
};

const fieldClass =
  "h-12 rounded-xl border border-[#d9e2f2] bg-[#eef3ff] px-3 text-sm outline-none focus-visible:border-[#5c4de0]";

export function OnboardingForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(onboardingAction, null);
  const [step, setStep] = useState<OnboardingStep>("role");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("ES");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<SignupRole | "">("");
  const [referralSource, setReferralSource] = useState<ReferralSource | "">("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  function goNext() {
    if (step === "role") {
      if (role === "") {
        setLocalMessage(authCopy.roleRequired);
        return;
      }

      setLocalMessage(null);
      setStep("identity");
      return;
    }

    if (step === "identity") {
      if (!splitAccountName(fullName)) {
        setLocalMessage(authCopy.fullNameRequired);
        return;
      }

      if (nationalId.trim().length === 0) {
        setLocalMessage(authCopy.nationalIdRequired);
        return;
      }

      if (!isValidSpanishCif(nationalId)) {
        setLocalMessage(authCopy.nationalIdInvalid);
        return;
      }

      if (!isValidPhoneNational(phoneCountry, phone)) {
        setLocalMessage(phoneCountry === "ES" ? authCopy.phoneInvalid : authCopy.phoneInvalidInternational);
        return;
      }

      setLocalMessage(null);
      setStep("referral");
    }
  }

  function goBack() {
    setLocalMessage(null);
    if (step === "identity") {
      setStep("role");
      return;
    }

    setStep("identity");
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
        if (submitter instanceof HTMLButtonElement && submitter.dataset.signOut === "true") {
          return;
        }
        if (step !== "referral") {
          event.preventDefault();
          goNext();
        }
      }}
    >
      <input type="hidden" name="fullName" value={fullName} />
      <input type="hidden" name="nationalId" value={nationalId} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="phoneCountry" value={phoneCountry} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="referralSource" value={referralSource} />
      <p className="text-sm text-[#5c6b78]">
        {authCopy.stepOf} {stepNumber[step]} {authCopy.stepOfTotal}
      </p>
      {step === "role" ? (
        <fieldset>
          <legend className="text-sm font-medium text-[#1c2740]">{authCopy.roleQuestion}</legend>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {signupRoles.map((option) => {
              const Icon = roleIcons[option];
              const selected = role === option;
              return (
                <label
                  key={option}
                  className={
                    selected
                      ? "cursor-pointer rounded-2xl border border-[#3d34b8] bg-[#f7f6ff] p-4"
                      : "cursor-pointer rounded-2xl border border-[#e1e6ee] bg-white p-4"
                  }
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="role-choice"
                      value={option}
                      checked={selected}
                      onChange={() => {
                        setRole(option);
                      }}
                      className="mt-1 accent-[#5c4de0]"
                    />
                    <Icon className="size-5 text-[#243140]" aria-hidden />
                    <span className="text-sm font-semibold">{authCopy.roleCards[option].title}</span>
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-[#5c6b78]">{authCopy.roleCards[option].body}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {step === "identity" ? (
        <div className="grid gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
            {authCopy.fullNameLabel}
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={161}
              placeholder={authCopy.fullNamePlaceholder}
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
              }}
              className={fieldClass}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
              {authCopy.nationalIdLabel}
              <input
                type="text"
                autoComplete="off"
                required
                maxLength={12}
                placeholder={authCopy.nationalIdPlaceholder}
                value={nationalId}
                aria-invalid={localMessage === authCopy.nationalIdInvalid}
                onChange={(event) => {
                  setNationalId(event.target.value.toUpperCase());
                }}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
              {authCopy.phoneLabel}
              <PhoneField country={phoneCountry} national={phone} onCountryChange={setPhoneCountry} onNationalChange={setPhone} />
            </label>
          </div>
        </div>
      ) : null}
      {step === "referral" ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-[#1c2740]">{authCopy.referralQuestion}</legend>
          {referralSources.map((option) => {
            const source = authCopy.referralSources[option];
            return (
              <label key={option} className="flex items-start gap-3 rounded-2xl border border-[#e1e6ee] px-4 py-3 text-sm">
                <input
                  type="radio"
                  name="referral-choice"
                  value={option}
                  checked={referralSource === option}
                  onChange={() => {
                    setReferralSource(option);
                  }}
                  className="mt-1 accent-[#5c4de0]"
                />
                <span>
                  <span className="block font-medium">{source.label}</span>
                  <span className="block text-[#5c6b78]">{source.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}
      {localMessage || (step === "referral" && state?.message) ? (
        <p role="alert" className="text-sm text-red-700">
          {localMessage ?? state?.message}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-t border-[#e6e9f0] pt-4">
        {step === "role" ? (
          <button
            type="submit"
            data-sign-out="true"
            formAction={signOutAction}
            className="text-sm text-[#3d4a63] hover:text-[#3d34b8]"
          >
            {authCopy.signOut}
          </button>
        ) : (
          <Button type="button" variant="outline" onClick={goBack} className="h-11 rounded-xl">
            {authCopy.previousStep}
          </Button>
        )}
        {step === "referral" ? (
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl bg-[#3d4a8a] px-5 text-white hover:bg-[#32407a]"
          >
            {pending ? authCopy.onboardingPending : authCopy.finishOnboarding}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} className="h-11 rounded-xl bg-[#3d4a8a] px-5 text-white hover:bg-[#32407a]">
            {authCopy.nextStep}
          </Button>
        )}
      </div>
    </form>
  );
}
