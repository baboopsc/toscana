import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} tanımlı değil. Bilgisayarda: kök klasörde "npm run setup" çalıştırın. Render'da: Environment sekmesine ekleyin.`,
    );
  }
  return value;
}

/** İnternetteki adres: PUBLIC_URL elle verilebilir, Render bunu RENDER_EXTERNAL_URL ile kendisi verir. */
function publicUrl(): string | null {
  const value = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  return value ? value.replace(/\/+$/, '') : null;
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  publicUrl: publicUrl(),
};
