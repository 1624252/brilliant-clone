/** Turn a Firebase auth error into a friendly, specific message. */
export function friendlyAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err ? String(err.code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/missing-password':
      return 'Please enter a password.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/email-already-in-use':
      return 'An account already exists for that email.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.'
    case 'auth/requires-recent-login':
      return 'For your security, please re-enter your password and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'That window was closed before finishing. Please try again.'
    case 'auth/account-exists-with-different-credential':
      return 'This email is already used with a different sign-in method (try Google).'
    case 'auth/credential-already-in-use':
    case 'auth/provider-already-linked':
      return 'That sign-in method is already set up for this account.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. (Enable it in Firebase.)'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
