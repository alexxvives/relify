"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAction, deleteAccountAction, updateAccountAction, type AccountFormState } from "@/app/cuenta/actions";
import { AppToast } from "@/components/app-toast";
import { PhoneField } from "@/components/phone-field";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";
import { authCopy } from "@/lib/auth-copy";
import { accountDisplayName } from "@/lib/auth-input";
import { readStoredPhone } from "@/lib/phone-countries";

const fieldClassName =
  "h-11 w-full rounded-[14px] border border-[#e7eaee] bg-white px-3 text-base text-[#2b3b4a] outline-none focus-visible:border-[#465ab4] focus-visible:ring-3 focus-visible:ring-[#465ab4]/20";

export function AccountSettings({
  name: initialName,
  lastName: initialLastName,
  email: initialEmail,
  phone: initialPhone,
  nationalId: initialNationalId,
  photo = null,
  middle = null,
}: {
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  nationalId: string | null;
  photo?: ReactNode;
  middle?: ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const leaveHrefRef = useRef<string | null>(null);
  const sawLeavePending = useRef(false);
  const storedPhone = readStoredPhone(initialPhone);
  const starting = {
    fullName: accountDisplayName(initialName, initialLastName),
    email: initialEmail,
    phoneCountry: storedPhone.iso,
    phone: storedPhone.national,
    nationalId: initialNationalId ?? "",
  };
  const [fullName, setFullName] = useState(starting.fullName);
  const [email, setEmail] = useState(starting.email);
  const [phoneCountry, setPhoneCountry] = useState(starting.phoneCountry);
  const [phone, setPhone] = useState(starting.phone);
  const [nationalId, setNationalId] = useState(starting.nationalId);
  const [baseline, setBaseline] = useState(starting);
  const [seenSave, setSeenSave] = useState<AccountFormState>(null);
  const [profileState, updateProfile, profilePending] = useActionState<AccountFormState, FormData>(updateAccountAction, null);
  const [passwordState, changePassword, passwordPending] = useActionState<AccountFormState, FormData>(changePasswordAction, null);
  const [deleteState, deleteAccount, deletePending] = useActionState<AccountFormState, FormData>(deleteAccountAction, null);
  const dirty =
    fullName !== baseline.fullName ||
    email !== baseline.email ||
    phone !== baseline.phone ||
    phoneCountry !== baseline.phoneCountry ||
    nationalId !== baseline.nationalId;

  if (profileState?.saved && profileState !== seenSave) {
    setSeenSave(profileState);
    const nextEmail = profileState.emailHeld ? baseline.email : email;
    if (profileState.emailHeld && email !== baseline.email) {
      setEmail(baseline.email);
    }
    setBaseline({ fullName, email: nextEmail, phone, phoneCountry, nationalId });
  }

  useEffect(() => {
    const href = leaveHrefRef.current;
    if (!href) {
      return;
    }

    if (profilePending) {
      sawLeavePending.current = true;
      return;
    }

    if (!sawLeavePending.current || !profileState) {
      return;
    }

    sawLeavePending.current = false;
    leaveHrefRef.current = null;
    if (profileState.saved) {
      router.push(href);
    }
  }, [profilePending, profileState, router]);

  function saveAndLeave(href: string) {
    const form = formRef.current;
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    leaveHrefRef.current = href;
    form.requestSubmit();
  }

  return (
    <div className="flex flex-col gap-6">
      <UnsavedChangesGuard dirty={dirty} onSave={saveAndLeave} />
      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <form ref={formRef} action={updateProfile} className="flex flex-col gap-4">
          <div className={photo ? "grid items-start gap-5 md:grid-cols-[8rem_minmax(0,1fr)]" : ""}>
          {photo}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.fullNameLabel}
              <input
                name="fullName"
                autoComplete="name"
                required
                maxLength={161}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.nationalIdLabel}
              <input
                name="nationalId"
                autoComplete="off"
                required
                maxLength={12}
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value.toUpperCase())}
                className={fieldClassName}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.emailFieldLabel}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={160}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.phoneLabel}
              <PhoneField
                country={phoneCountry}
                national={phone}
                onCountryChange={setPhoneCountry}
                onNationalChange={setPhone}
              />
            </label>
          </div>
          </div>
          <AppToast message={profileState?.saved ? profileState.message : null} />
          {profileState && !profileState.saved ? (
            <p role="alert" className="text-sm text-[#c0362c]">
              {profileState.message}
            </p>
          ) : null}
          {dirty ? (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profilePending}
                className="inline-flex h-11 items-center rounded-[14px] bg-[#465ab4] px-4 text-base font-medium text-white disabled:opacity-60"
              >
                {profilePending ? authCopy.onboardingPending : authCopy.accountSave}
              </button>
            </div>
          ) : null}
        </form>
      </section>

      {middle}

      <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#2b3b4a]">{authCopy.accountPasswordTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.accountPasswordIntro}</p>
        <form action={changePassword} className="layout-cards mt-4 items-end">
          <SecretField name="currentPassword" label={authCopy.passwordCurrent} autoComplete="current-password" />
          <SecretField name="newPassword" label={authCopy.passwordNew} autoComplete="new-password" minLength={8} maxLength={128} />
          <SecretField name="confirmPassword" label={authCopy.passwordConfirm} autoComplete="new-password" minLength={8} maxLength={128} />
          <button
            type="submit"
            disabled={passwordPending}
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#465ab4] px-4 text-base font-medium text-white disabled:opacity-60"
          >
            {passwordPending ? authCopy.onboardingPending : authCopy.passwordSave}
          </button>
          <AppToast message={passwordState?.saved ? passwordState.message : null} />
          {passwordState && !passwordState.saved ? (
            <p role="alert" className="text-sm text-[#c0362c] lg:col-span-4">
              {passwordState.message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-2xl border border-[#f0c2c2] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#c0362c]">{authCopy.deleteTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.deleteBody}</p>
        <form action={deleteAccount} className="mt-4 flex flex-col gap-4">
          <SecretField name="password" label={authCopy.deletePassword} autoComplete="current-password" />
          <label className="flex flex-col gap-2 text-sm font-medium">
            {authCopy.deleteConfirmLabel}
            <input name="confirm" autoComplete="off" required className={fieldClassName} />
          </label>
          {deleteState ? (
            <p role="alert" className="text-sm text-[#c0362c]">
              {deleteState.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={deletePending}
              className="inline-flex h-11 items-center rounded-[14px] bg-[#c0362c] px-4 text-base font-medium text-white disabled:opacity-60"
            >
              {deletePending ? authCopy.deletePending : authCopy.deleteSubmit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SecretField({
  name,
  label,
  autoComplete,
  minLength,
  maxLength,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <span className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          className={`${fieldClassName} pr-11`}
        />
        <button
          type="button"
          aria-label={visible ? authCopy.hidePassword : authCopy.showPassword}
          onClick={() => {
            setVisible((current) => !current);
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[#667085] hover:text-[#2b3b4a]"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </span>
    </label>
  );
}
