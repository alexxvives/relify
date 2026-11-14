import { authCopy } from "@/lib/auth-copy";
import { identityDeclarationField } from "@/lib/identity-declaration";

export function IdentityDeclarationCheckbox({
  invalid = false,
  checked,
  onCheckedChange,
  named = true,
}: {
  invalid?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** When false, the parent posts a hidden field instead (multi-step forms). */
  named?: boolean;
}) {
  const controlled = onCheckedChange !== undefined;
  return (
    <label className={`mt-3 flex items-start gap-2.5 text-sm leading-5 text-[#1c2740] ${invalid ? "releva-shake" : ""}`}>
      <input
        type="checkbox"
        name={named && !controlled ? identityDeclarationField : undefined}
        required={!controlled}
        checked={controlled ? checked : undefined}
        onChange={
          controlled
            ? (event) => {
                onCheckedChange(event.target.checked);
              }
            : undefined
        }
        className="mt-0.5 size-4 shrink-0 rounded border-[#c5ccd8] text-[#465ab4] focus-visible:ring-2 focus-visible:ring-[#2fc4b2]"
      />
      <span>{authCopy.identityDeclaration}</span>
    </label>
  );
}
