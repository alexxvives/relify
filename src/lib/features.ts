// Feature flags. Flip only when the backing service exists.
export const features = {
  /**
   * Phone verification by SMS code (Alex, t50). OFF: Relify has no SMS provider yet, so the code
   * box would promise a message that never arrives. Turn on once a provider (e.g. Twilio Verify)
   * and a server action that sends and checks the code are wired in.
   */
  phoneOtp: false,
} as const;
