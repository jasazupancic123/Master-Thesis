export async function runScript(name: string, fn: () => Promise<void>) {
  const start = Date.now();

  console.log(`\n=== Running script: ${name} ===`);

  try {
    await fn();

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`=== Script "${name}" finished in ${duration}s ===\n`);

    process.exit(0);
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.error(`❌ Script "${name}" failed after ${duration}s`);
    console.error(err);
    process.exit(1);
  }
}
