"use client";

import { NewPasswordField } from "@/components/auth/new-password-field";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, deleteAccountAction, updateAccountAction, type AccountFormState } from "@/app/(app)/cuenta/actions";
import { AppToast } from "@/components/shell/app-toast";
import { PhoneField } from "@/components/auth/phone-field";
import { UnsavedChangesGuard } from "@/components/shell/unsaved-changes";
import { authCopy } from "@/lib/auth-copy";
import { accountDisplayName, nationalIdSchema, splitAccountName } from "@/lib/auth-input";
import { isValidPhoneNational, readStoredPhone } from "@/lib/phone-countries";
import { Button, Card, Field, Input, PasswordInput } from "@/components/ui/form";

/** S27: /cuenta saves itself this long after the last keystroke (email: on blur, so one change sends one link). */
export const accountAutosaveMs = 800;

export function AccountSettings({
  name: initialName,
  lastName: initialLastName,
  email: initialEmail,
  phone: initialPhone,
  nationalIdMasked: initialNationalIdMasked,
  photo = null,
  middle = null,
  agreement = null,
}: {
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  nationalIdMasked: string | null;
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
    nationalId: "",
  };
  const storedMasked = initialNationalIdMasked ?? "";
  const [fullName, setFullName] = useState(starting.fullName);
  const [email, setEmail] = useState(starting.email);
  // The email only goes to the server once committed (blur / Enter): an email change sends a confirmation link.
  const [committedEmail, setCommittedEmail] = useState(starting.email);
  const [phoneCountry, setPhoneCountry] = useState(starting.phoneCountry);
  const [phone, setPhone] = useState(starting.phone);
  // S39 (Alex): the DNI/NIE is a plain field (no Cambiar). Typing stays a draft; it commits on blur when valid.
  const [idDraft, setIdDraft] = useState("");
  const [idError, setIdError] = useState(false);
  const [nationalId, setNationalId] = useState("");
  const [idSaved, setIdSaved] = useState(false);
  const [baseline, setBaseline] = useState(starting);
  const [seenSave, setSeenSave] = useState<AccountFormState>(null);
  const [profileState, updateProfile, profilePending] = useActionState<AccountFormState, FormData>(updateAccountAction, null);
  const [passwordState, changePassword, passwordPending] = useActionState<AccountFormState, FormData>(changePasswordAction, null);
  const [deleteState, deleteAccount, deletePending] = useActionState<AccountFormState, FormData>(deleteAccountAction, null);
  const keepStoredId = storedMasked.length > 0 && nationalId.length === 0;
  const dirty =
    fullName !== baseline.fullName ||
    committedEmail !== baseline.email ||
    phone !== baseline.phone ||
    phoneCountry !== baseline.phoneCountry ||
    nationalId !== baseline.nationalId;

  if (profileState?.saved && profileState !== seenSave) {
    setSeenSave(profileState);
    const nextEmail = profileState.emailHeld ? baseline.email : committedEmail;
    if (profileState.emailHeld && committedEmail !== baseline.email) {
      setEmail(baseline.email);
      setCommittedEmail(baseline.email);
    }
    if (nationalId !== baseline.nationalId) setIdSaved(true);
    setBaseline({ fullName, email: nextEmail, phone, phoneCountry, nationalId });
  }

  // Alex (S27): no Guardar button on /cuenta. Valid changes save on their own after a short pause; a
  // half-typed DNI/NIE or phone waits until it is complete, so typing never flashes an error.
  const readyToSave =
    dirty &&
    !profilePending &&
    splitAccountName(fullName) !== null &&
    (phone.length === 0 || isValidPhoneNational(phoneCountry, phone)) &&
    (keepStoredId ? true : nationalId.trim().length === 0 ? storedMasked.length === 0 : nationalIdSchema.safeParse(nationalId).success);

  useEffect(() => {
    if (!readyToSave) {
      return;
    }
    const timer = window.setTimeout(() => {
      const form = formRef.current;
      if (form?.checkValidity()) {
        form.requestSubmit();
      }
    }, accountAutosaveMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [readyToSave, fullName, committedEmail, phone, phoneCountry, nationalId]);

  function commitId() {
    const value = idDraft.trim();
    if (value.length === 0) {
      setIdError(false);
      return;
    }
    const valid = nationalIdSchema.safeParse(value).success;
    setIdError(!valid);
    if (valid && value !== nationalId) {
      setIdSaved(false);
      setNationalId(value);
    }
  }

  function commitEmail() {
    const field = document.getElementById("account-email");
    if (field instanceof HTMLInputElement && field.checkValidity() && email.trim().length > 0) {
      setCommittedEmail(email.trim());
    }
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
    <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-6">
      {/* S39 (Alex): warn on leave only while a save is waiting, in flight or failed, never for a saved form. */}
      <UnsavedChangesGuard dirty={readyToSave || profilePending || (profileState !== null && !profileState.saved && dirty)} onSave={saveAndLeave} />
      <div className={agreement ? "grid items-stretch gap-6 lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_16rem] 2xl:grid-cols-[minmax(0,1fr)_18rem]" : ""}>
      <Card>
        <form ref={formRef} action={updateProfile} className="flex flex-col gap-4">
          {/* Alex (S25): photo beside the fields as soon as the card has room, and the fields in
              pairs (Nombre | DNI/NIE, Email | Teléfono), so the avatar is never left alone on top. */}
          <div className="@container/account">
          <div className={photo ? "grid items-start gap-5 @[34rem]/account:grid-cols-[7rem_minmax(0,1fr)]" : ""}>
          {photo}
          <div className="@container/fields min-w-0">
          <div className="grid gap-4 @[26rem]/fields:grid-cols-2">
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
            <div className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.nationalIdLabel}
              <span className="flex items-center justify-between gap-2">
                {authCopy.nationalIdLabel}
                {idSaved && !profilePending ? (
                  <span role="status" className="text-xs font-medium text-[#067647]" data-id-saved>
                    {authCopy.nationalIdSaved}
                  </span>
                ) : null}
              </span>
              {keepStoredId ? <input type="hidden" name="nationalIdKeep" value="1" /> : <input type="hidden" name="nationalId" value={nationalId} />}
              <Input
                id="account-national-id"
                autoComplete="off"
                aria-label={authCopy.nationalIdLabel}
                aria-invalid={idError || undefined}
                aria-describedby={idError ? "account-national-id-error" : undefined}
                placeholder={storedMasked || authCopy.nationalIdPlaceholder}
                maxLength={12}
                value={idDraft}
                onChange={(event) => {
                  setIdDraft(event.target.value.toUpperCase());
                  setIdError(false);
                }}
                onBlur={commitId}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitId();
                  }
                }}
                className="tracking-widest tabular-nums"
              />
              {idError ? (
                <span id="account-national-id-error" className="text-xs font-normal text-[#b42318]">
                  {authCopy.nationalIdInvalid}
                </span>
              ) : null}
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              {authCopy.emailFieldLabel}
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                required
                maxLength={160}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={commitEmail}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitEmail();
                  }
                }}
              />
              <input type="hidden" name="email" value={committedEmail} />
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
          </div>
          </div>
          {/* Silent autosave: only the email-change notice and a failed save are shown. */}
          <AppToast message={profileState?.saved && profileState.emailHeld ? profileState.message : null} />
          <AppToast message={profileState && !profileState.saved ? profileState.message : null} tone="error" />
        </form>
      </Card>
      {agreement ? <div className="min-w-0 w-full">{agreement}</div> : null}
      </div>

      {middle}

      <Card>
        <h2 className="text-xl font-semibold text-[#2b3b4a]">{authCopy.accountPasswordTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.accountPasswordIntro}</p>
        {/* Alex (S25): the three fields always share one row; the button drops to its own row
            (right-aligned) when it does not fit beside them. Phones stack. */}
        <form action={changePassword} className="@container/password mt-4 min-w-0">
          <div className="grid min-w-0 items-start gap-4 @[36rem]/password:grid-cols-3 @[60rem]/password:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
            <SecretField name="currentPassword" label={authCopy.passwordCurrent} autoComplete="current-password" />
            <NewPasswordField name="newPassword" label={authCopy.passwordNew} compact />
            <SecretField name="confirmPassword" label={authCopy.passwordConfirm} autoComplete="new-password" minLength={8} maxLength={128} />
            <Button
              type="submit"
              disabled={passwordPending}
              className="@[36rem]/password:col-span-3 @[36rem]/password:justify-self-end @[60rem]/password:col-span-1 @[60rem]/password:mt-7"
            >
              {passwordPending ? authCopy.onboardingPending : authCopy.passwordSave}
            </Button>
            <AppToast message={passwordState?.saved ? passwordState.message : null} />
            {passwordState && !passwordState.saved ? (
              <p role="alert" className="text-sm text-[#c0362c] @[36rem]/password:col-span-3 @[60rem]/password:col-span-4">
                {passwordState.message}
              </p>
            ) : null}
          </div>
        </form>
      </Card>

      <Card tone="danger">
        <h2 className="text-xl font-semibold text-[#c0362c]">{authCopy.deleteTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{authCopy.deleteBody}</p>
        {/* Alex (S26): like the password row, the two fields shrink as the screen narrows and the delete
            button stays on the right; it drops to its own row only when it truly does not fit. */}
        <form action={deleteAccount} className="mt-4 min-w-0">
          <div className="flex min-w-0 flex-wrap items-end gap-4">
            <div className="@container/delete grid min-w-[min(100%,20rem)] flex-[1_1_20rem] items-start gap-4">
              <div className="grid min-w-0 items-start gap-4 @[22rem]/delete:grid-cols-2">
                <SecretField name="password" label={authCopy.deletePassword} autoComplete="current-password" />
                <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
                  {authCopy.deleteConfirmLabel}
                  <Input name="confirm" autoComplete="off" required />
                </label>
              </div>
            </div>
            <Button
              type="submit"
              disabled={deletePending}
              tone="danger"
              className="ml-auto shrink-0 max-sm:h-12 max-sm:w-full max-sm:rounded-full"
            >
              {deletePending ? authCopy.deletePending : authCopy.deleteSubmit}
            </Button>
          </div>
          {deleteState ? (
            <p role="alert" className="mt-3 text-sm text-[#c0362c]">
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
