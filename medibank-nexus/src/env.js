const required = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
};

const missing = Object.entries(required)
  .filter(([_, val]) => !val)
  .map(([key]) => key);

if (missing.length > 0) {
  const errorMsg = `[ENV VALIDATION] Missing required environment variable(s): ${missing.join(', ')}. Please check your .env file.`;
  console.warn(errorMsg);
  if (import.meta.env.PROD) {
    throw new Error(errorMsg);
  }
}

export const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  VITE_PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? 'pk_test_xxxx',
};
