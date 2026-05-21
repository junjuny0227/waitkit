export class WaitKitTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaitKitTimeoutError';
  }
}
