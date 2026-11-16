"use client";

import { Input } from "@/components/ui/form";
import { ArcScope } from "@/components/arc/arc-scope";
import { Stepper } from "@/components/arc/stepper/stepper";

import { useState } from "react";
import { useActionState } from "react";
import { onboardingAction, type OnboardingState } from "@/app/onboarding/actions";
import { AdvisorPlanStep, BuyerPlanStep, type OnboardingPlanChoice } from "@/components/auth/onboarding-plan-step";
import { PhoneField } from "@/components/auth/phone-field";
import { PhoneOtp } from "@/components/auth/phone-otp";
import { billingCopy } from "@/lib/billing-copy";
import { authCopy } from "@/lib/auth-copy";
import { referralSources, splitAccountName, type ReferralSource, type SignupRole } from "@/lib/auth-input";
import { isValidPhoneNational } from "@/lib/phone-countries";
import { isValidSpanishPersonId } from "@/lib/spanish-cif";

type OnboardingStep = "identity" | "phone" | "referral" | "plan";
type IdentityField = "name" | "nationalId" | "phone";


const stepLabel: Record<OnboardingStep, string> = {
  identity: authCopy.fullNameLabel,
  phone: authCopy.phoneLabel,
  referral: authCopy.referralQuestion,
  plan: billingCopy.onboardingPlanStep,
};


export function OnboardingForm({ initialRole = "" }: { initialRole?: SignupRole | "" }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(onboardingAction, null);
  const [step, setStep] = useState<OnboardingStep>("identity");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("ES");
  const [phone, setPhone] = useState("");
  const [referralSource, setReferralSource] = useState<ReferralSource | "">("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<IdentityField | null>(null);
  const [referralMissing, setReferralMissing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [plan, setPlan] = useState<OnboardingPlanChoice>("none");
  const withPlan = initialRole === "investor" || initialRole === "advisor";
  const stepOrder: OnboardingStep[] = withPlan ? ["identity", "phone", "referral", "plan"] : ["identity", "phone", "referral"];
  const lastStep = stepOrder[stepOrder.length - 1];
  const stepIndex = stepOrder.indexOf(step);

  function reject(field: IdentityField, message: string) {
    setInvalidField(field);
    setLocalMessage(message);
    setAttempt((current) => current + 1);
  }

  function goNext() {
    setReferralMissing(false);

    if (step === "identity") {
      if (initialRole === "") {
        setInvalidField(null);
        setLocalMessage(authCopy.roleRequired);
        return;
      }

      if (!splitAccountName(fullName)) {
        reject("name", authCopy.fullNameRequired);
        return;
      }

      if (nationalId.trim().length === 0) {
        reject("nationalId", authCopy.nationalIdRequired);
        return;
      }

      if (!isValidSpanishPersonId(nationalId)) {
        reject("nationalId", authCopy.nationalIdInvalid);
        return;
      }

      setInvalidField(null);
      setLocalMessage(null);
      setStep("phone");
      return;
    }

    if (step === "phone") {
      if (!isValidPhoneNational(phoneCountry, phone)) {
        reject("phone", phoneCountry === "ES" ? authCopy.phoneInvalid : authCopy.phoneInvalidInternational);
        return;
      }

      setInvalidField(null);
      setLocalMessage(null);
      setStep("referral");
      return;
    }

    if (step === "referral" && withPlan) {
      if (referralSource === "") {
        setReferralMissing(true);
        setAttempt((current) => current + 1);
        return;
      }

      setStep("plan");
    }
  }

  function goBack() {
    setLocalMessage(null);
    setInvalidField(null);
    setReferralMissing(false);
    const previous = stepOrder[stepIndex - 1];
    if (previous) {
      setStep(previous);
    }
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        if (step !== lastStep || referralSource === "") {
          event.preventDefault();
          if (step === "referral" && lastStep === "referral") {
            setReferralMissing(true);
            setAttempt((current) => current + 1);
            return;
          }
          goNext();
        }
      }}
    >
      <input type="hidden" name="fullName" value={fullName} />
      <input type="hidden" name="nationalId" value={nationalId} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="phoneCountry" value={phoneCountry} />
      <input type="hidden" name="role" value={initialRole} />
      <input type="hidden" name="referralSource" value={referralSource} />
      <input type="hidden" name="plan" value={initialRole === "investor" ? plan : "none"} />
      <ArcScope className="mb-1">
        <Stepper
          steps={stepOrder.map((item) => ({ id: item, label: stepLabel[item] }))}
          current={stepIndex}
          align="center"
          label={authCopy.stepsLabel}
        />
      </ArcScope>
      <p className="sr-only">
        {authCopy.stepOf} {stepIndex + 1} de {stepOrder.length}
      </p>
      {step === "identity" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
            {authCopy.fullNameLabel}
            <Input
              key={invalidField === "name" ? `name-${attempt}` : "name"}
              type="text"
              autoComplete="name"
              required
              maxLength={161}
              placeholder={authCopy.fullNamePlaceholder}
              value={fullName}
              aria-invalid={invalidField === "name"}
              onChange={(event) => {
                setFullName(event.target.value);
                if (invalidField === "name") {
                  setInvalidField(null);
                  setLocalMessage(null);
                }
              }}
              className={invalidField === "name" ? "releva-shake border-2" : ""}
            />
            {invalidField === "name" && localMessage ? (
              <span role="alert" className="text-sm font-normal text-[#c0362c]">
                {localMessage}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
            {authCopy.nationalIdLabel}
            <Input
              key={invalidField === "nationalId" ? `id-${attempt}` : "id"}
              type="text"
              autoComplete="off"
              required
              maxLength={12}
              placeholder={authCopy.nationalIdPlaceholder}
              value={nationalId}
              aria-invalid={invalidField === "nationalId"}
              onChange={(event) => {
                setNationalId(event.target.value.toUpperCase());
                if (invalidField === "nationalId") {
                  setInvalidField(null);
                  setLocalMessage(null);
                }
              }}
              className={invalidField === "nationalId" ? "releva-shake border-2" : ""}
            />
            {invalidField === "nationalId" && localMessage ? (
              <span role="alert" className="text-sm font-normal text-[#c0362c]">
                {localMessage}
              </span>
            ) : null}
          </label>
        </div>
      ) : null}
      {step === "phone" ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#1c2740]">
          {authCopy.phoneLabel}
          <span key={invalidField === "phone" ? `phone-${attempt}` : "phone"} className={invalidField === "phone" ? "releva-shake block" : "block"}>
            <PhoneField
              country={phoneCountry}
              national={phone}
              invalid={invalidField === "phone"}
              onCountryChange={(value) => {
                setPhoneCountry(value);
                if (invalidField === "phone") {
                  setInvalidField(null);
                  setLocalMessage(null);
                }
              }}
              onNationalChange={(value) => {
                setPhone(value);
                if (invalidField === "phone") {
                  setInvalidField(null);
                  setLocalMessage(null);
                }
              }}
            />
          </span>
          {invalidField === "phone" && localMessage ? (
            <span role="alert" className="text-sm font-normal text-[#c0362c]">
              {localMessage}
            </span>
          ) : null}
        </label>
      ) : null}
      {step === "phone" ? <PhoneOtp phone={phone} /> : null}
      {step === "referral" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1c2740]">{authCopy.referralQuestion}</p>
          <div key={referralMissing ? `referral-${attempt}` : "referral"} className={referralMissing ? "releva-shake grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
            {referralSources.map((option) => {
              const source = authCopy.referralSources[option];
              const selected = referralSource === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setReferralSource(option);
                    setReferralMissing(false);
                  }}
                  className={
                    selected
                      ? "rounded-2xl border border-[#465ab4] bg-[#eef2ff] px-4 py-3 text-left text-sm shadow-[inset_0_0_0_1px_#465ab4]"
                      : referralMissing
                        ? "rounded-2xl border border-[#c0362c] bg-[#fff6f6] px-4 py-3 text-left text-sm shadow-[inset_0_0_0_1px_#c0362c]"
                        : "rounded-2xl border border-[#e1e6ee] bg-white px-4 py-3 text-left text-sm hover:border-[#465ab4]"
                  }
                >
                  <span className="block font-medium text-[#1c2740]">{source.label}</span>
                  <span className="mt-1 block text-[#5c6b78]">{source.description}</span>
                </button>
              );
            })}
          </div>
          {referralMissing ? (
            <p role="alert" className="text-sm text-[#c0362c]">
              {authCopy.referralRequired}
            </p>
          ) : null}
        </div>
      ) : null}
      {step === "plan" && initialRole === "investor" ? <BuyerPlanStep value={plan} onChange={setPlan} /> : null}
      {step === "plan" && initialRole === "advisor" ? <AdvisorPlanStep /> : null}
      {invalidField === null && localMessage ? (
        <p role="alert" className="text-sm text-[#c0362c]">
          {localMessage}
        </p>
      ) : null}
      {step === lastStep && state?.message && !referralMissing ? (
        <p role="alert" className="text-sm text-[#c0362c]">
          {state.message}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-t border-[#e6e9f0] pt-4">
        {step === "identity" ? (
          <span />
        ) : (
          <button type="button" onClick={goBack} className="inline-flex h-11 items-center rounded-xl border border-[#d5dee8] bg-white px-4 text-sm font-medium text-[#1c2740]">
            {authCopy.previousStep}
          </button>
        )}
        {step === lastStep ? (
          <button
            key="submit"
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-xl bg-[#3d4a8a] px-5 text-sm font-medium text-white hover:bg-[#32407a] disabled:opacity-60"
          >
            {pending
              ? authCopy.onboardingPending
              : step === "plan" && initialRole === "investor"
                ? plan === "none"
                  ? billingCopy.onboardingPlanFinishFree
                  : billingCopy.onboardingPlanFinishPaid
                : authCopy.finishOnboarding}
          </button>
        ) : (
          <button key="next" type="button" onClick={goNext} className="inline-flex h-11 items-center rounded-xl bg-[#3d4a8a] px-5 text-sm font-medium text-white hover:bg-[#32407a]">
            {authCopy.nextStep}
          </button>
        )}
      </div>
    </form>
  );
}
