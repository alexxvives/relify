"use client";

import { NewPasswordField } from "@/components/new-password-field";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, deleteAccountAction, updateAccountAction, type AccountFormState } from "@/app/(app)/cuenta/actions";
import { AppToast } from "@/components/app-toast";
import { PhoneField } from "@/components/phone-field";
import { UnsavedChangesGuard } from "@/components/unsaved-changes";
import { authCopy } from "@/lib/auth-copy";
import { accountDisplayName } from "@/lib/auth-input";
import { readStoredPhone } from "@/lib/phone-countries";
import { Button, Card, Field, Input, PasswordInput } from "@/components/ui/form";

export function AccountSettings({
  name: initialName,
  lastName: initialLastName,
  email: initialEmail,
  phone: initialPhone,
  nationalId: initialNationalId,
  photo = null,
  middle = null,
  agreement = null,
}: {
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  nationalId: string | null;
  photo?: ReactNode;
  middle?: ReactNode;
  agreement?: ReactNode;
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
      <div className={agreement ? "grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]" : ""}>
      <Card>
        <form ref={formRef} action={updateProfile} className="flex flex-col gap-4">
          <div className={photo ? "grid items-start gap-5 md:grid-cols-[8rem_minmax(0,1fr)]" : ""}>
          {photo}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.fullNameLabel}
              <Input
                name="fullName"
                autoComplete="name"
                required
                maxLength={161}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.nationalIdLabel}
              <Input
                name="nationalId"
                autoComplete="off"
                required
                maxLength={12}
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value.toUpperCase())}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.emailFieldLabel}
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={160}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              <Button
                type="submit"
                disabled={profilePending}
>
                {profilePending ? authCopy.onboardingPending : authCopy.accountSave}
              </Button>
            </div>
          ) : null}
        </form>
      </Card>
      {agreement ? (
        <div className="mx-auto flex w-full max-w-60 md:mx-0 md:max-w-none">{agreement}</div>
      ) : null}
      </div>

      {middle}

      <Card>
        <h2 className="text-xl font-semibold text-[#2b3b4a]">{authCopy.accountPasswordTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.accountPasswordIntro}</p>
        <form action={changePassword} className="mt-4 grid min-w-0 items-start gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <SecretField name="currentPassword" label={authCopy.passwordCurrent} autoComplete="current-password" />
          <NewPasswordField name="newPassword" label={authCopy.passwordNew} compact />
          <SecretField name="confirmPassword" label={authCopy.passwordConfirm} autoComplete="new-password" minLength={8} maxLength={128} />
          <Button
            type="submit"
            disabled={passwordPending}
            className="xl:mt-7 md:col-span-2 xl:col-span-1"
>
            {passwordPending ? authCopy.onboardingPending : authCopy.passwordSave}
          </Button>
          <AppToast message={passwordState?.saved ? passwordState.message : null} />
          {passwordState && !passwordState.saved ? (
            <p role="alert" className="text-sm text-[#c0362c] md:col-span-2 xl:col-span-4">
              {passwordState.message}
            </p>
          ) : null}
        </form>
      </Card>

      <Card tone="danger">
        <h2 className="text-xl font-semibold text-[#c0362c]">{authCopy.deleteTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.deleteBody}</p>
        <form action={deleteAccount} className="mt-4 grid min-w-0 items-start gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <SecretField name="password" label={authCopy.deletePassword} autoComplete="current-password" />
          <label className="flex flex-col gap-2 text-sm font-medium">
            {authCopy.deleteConfirmLabel}
            <Input name="confirm" autoComplete="off" required />
          </label>
          <Button
            type="submit"
            disabled={deletePending}
            tone="danger"
            className="xl:mt-7 md:col-span-2 xl:col-span-1"
>
            {deletePending ? authCopy.deletePending : authCopy.deleteSubmit}
          </Button>
          {deleteState ? (
            <p role="alert" className="text-sm text-[#c0362c] md:col-span-2 xl:col-span-3">
              {deleteState.message}
            </p>
          ) : null}
        </form>
      </Card>
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
  return (
    <Field label={label}>
      <PasswordInput
        name={name}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={maxLength}
        showLabel={authCopy.showPassword}
        hideLabel={authCopy.hidePassword}
      />
    </Field>
  );
}
