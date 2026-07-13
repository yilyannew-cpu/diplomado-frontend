import { useMobileKeyboardAvoidance } from "@/hooks/useMobileKeyboardAvoidance";

/** Mount once at app root to keep inputs above the mobile soft keyboard. */
export function MobileKeyboardAvoidance() {
  useMobileKeyboardAvoidance();
  return null;
}
