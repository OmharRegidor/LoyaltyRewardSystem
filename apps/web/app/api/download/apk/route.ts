import { NextResponse } from "next/server";

const APK_URL =
  "https://expo.dev/artifacts/eas/NF66BsKUw6UceFzKHXa82.apk";

export async function GET() {
  const upstream = await fetch(APK_URL);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to fetch APK" },
      { status: 502 }
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.android.package-archive");
  headers.set(
    "Content-Disposition",
    'attachment; filename="NoxaLoyalty.apk"'
  );

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(upstream.body, { status: 200, headers });
}
