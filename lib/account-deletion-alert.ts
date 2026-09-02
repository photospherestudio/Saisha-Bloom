export function shouldSendDeletionFailureAlert(attempts: number) {
  return attempts >= 3;
}
