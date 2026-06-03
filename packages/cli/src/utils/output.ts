export function printSuccess(msg: string): void {
  console.log(`✓ ${msg}`);
}

export function printError(msg: string): void {
  console.error(`✗ ${msg}`);
}

export function printLine(msg: string): void {
  console.log(msg);
}
