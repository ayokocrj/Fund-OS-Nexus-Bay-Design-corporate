export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNightlyVerifier } = await import("./platform/scheduling");
    startNightlyVerifier();
  }
}
