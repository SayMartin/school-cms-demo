import { getCloudflareContext } from "@opennextjs/cloudflare";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let appEnv: string | undefined;
  try {
    appEnv = getCloudflareContext().env.APP_ENV;
  } catch {
    // Local dev server has no Cloudflare context — no banner
  }

  return (
    <div className="[&_h1]:text-gray-900">
      {appEnv === "prod" && (
        <div className="bg-brand-green px-4 py-1.5 text-center text-sm font-medium text-gray-800">
          PROD ENVIRONMENT — changes here go live on the public site immediately
        </div>
      )}
      {appEnv === "dev" && (
        <div className="sticky top-0 z-50 bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
          DEV ENVIRONMENT — for developers. Changes here go live on the public site immediately.
        </div>
      )}
      {children}
    </div>
  );
}
