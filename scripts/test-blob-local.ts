/**
 * Local E2E check for Vercel Blob order uploads.
 * Run: dotenv -e .env.local -- npx tsx scripts/test-blob-local.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { upload } from "@vercel/blob/client";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const PASSWORD = "test123456";

type StepResult = { name: string; ok: boolean; detail?: string };

const results: StepResult[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? `: ${detail}` : ""}`);
}

function fail(name: string, detail: string): never {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}: ${detail}`);
  process.exit(1);
}

function getCookieHeader(setCookie: string | null): string {
  if (!setCookie) return "";
  const match = setCookie.match(/printlocal_session=([^;]+)/);
  return match ? `printlocal_session=${match[1]}` : "";
}

async function fetchJson(
  url: string,
  init?: RequestInit & { cookie?: string }
): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const headers = new Headers(init?.headers);
  if (init?.cookie) headers.set("Cookie", init.cookie);

  const response = await fetch(url, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: response.status, body, setCookie };
}

async function main() {
  console.log(`\nBlob local E2E — ${BASE}\n`);

  // 1. Env
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (!token) fail("env BLOB_READ_WRITE_TOKEN", "missing in .env.local");
  if (!token.startsWith("vercel_blob_rw_")) {
    fail("env BLOB_READ_WRITE_TOKEN", "unexpected format");
  }
  pass("env BLOB_READ_WRITE_TOKEN", `set (${token.slice(0, 24)}…)`);
  if (storeId) pass("env BLOB_STORE_ID", storeId);

  // 2. upload-mode
  const modeRes = await fetchJson(`${BASE}/api/orders/upload-mode`);
  if (modeRes.status !== 200) {
    fail("GET /api/orders/upload-mode", `status ${modeRes.status}`);
  }
  const mode = modeRes.body as {
    mode?: string;
    hasReadWriteToken?: boolean;
    hasBlobStoreLink?: boolean;
  };
  if (mode.mode !== "blob-client") {
    fail("upload-mode", `expected blob-client, got ${JSON.stringify(mode)}`);
  }
  if (mode.hasReadWriteToken === false) {
    fail("upload-mode", "hasReadWriteToken is false");
  }
  pass(
    "GET /api/orders/upload-mode",
    JSON.stringify(mode)
  );

  // 3. Login as Anna
  const loginRes = await fetchJson(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "anna@example.com", password: PASSWORD }),
  });
  if (loginRes.status !== 200) {
    fail("login", `status ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }
  const cookie = getCookieHeader(loginRes.setCookie);
  if (!cookie) fail("login", "no session cookie");
  pass("POST /api/auth/login", "anna@example.com");

  // 4. Pick maker (not Anna's own workshop)
  const makersRes = await fetchJson(`${BASE}/api/makers`);
  if (makersRes.status !== 200) fail("makers", `status ${makersRes.status}`);
  const makers = makersRes.body as { id: string; status: string }[] | null;
  if (!Array.isArray(makers)) fail("makers", "unexpected response shape");
  const maker = makers.find((m) => m.status === "available");
  if (!maker) fail("makers", "no available maker");
  pass("GET /api/makers", maker.id);

  // 5. Create order
  const fileName = "test-cube.stl";
  const orderPayload = {
    makerId: maker.id,
    fileName,
    weightGrams: 50,
    widthMm: 20,
    heightMm: 20,
    depthMm: 20,
    deliveryMethod: "pickup",
  };
  const orderRes = await fetchJson(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cookie,
    body: JSON.stringify(orderPayload),
  });
  if (orderRes.status !== 201) {
    fail("create order", `status ${orderRes.status} ${JSON.stringify(orderRes.body)}`);
  }
  const orderId = (orderRes.body as { id: string }).id;
  pass("POST /api/orders", orderId);

  // 6. Minimal STL-like file for upload
  const tmpDir = path.join(process.cwd(), "storage", "test-tmp");
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, fileName);
  const fileContent = Buffer.from("solid test\nendsolid test\n");
  writeFileSync(tmpFile, fileContent);
  const file = new File([fileContent], fileName, {
    type: "application/octet-stream",
  });

  const pathname = `orders/${orderId}/${fileName}`;
  let blobUrl: string;
  try {
    const blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: `${BASE}/api/orders/${orderId}/file/upload`,
      headers: { Cookie: cookie },
    });
    blobUrl = blob.url;
  } catch (error) {
    fail(
      "blob client upload",
      error instanceof Error ? error.message : String(error)
    );
  }
  if (!blobUrl.includes(".blob.vercel-storage.com")) {
    fail("blob client upload", `unexpected url: ${blobUrl}`);
  }
  pass("blob client upload", blobUrl.slice(0, 60) + "…");

  // 7. Confirm upload
  const confirmRes = await fetchJson(`${BASE}/api/orders/${orderId}/file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cookie,
    body: JSON.stringify({ fileUrl: blobUrl }),
  });
  if (confirmRes.status !== 200) {
    fail("confirm upload", `status ${confirmRes.status} ${JSON.stringify(confirmRes.body)}`);
  }
  pass("POST /api/orders/[id]/file confirm");

  // 8. Download via API
  const downloadRes = await fetch(`${BASE}/api/orders/${orderId}/file`, {
    headers: { Cookie: cookie },
  });
  if (!downloadRes.ok) {
    fail("download file", `status ${downloadRes.status}`);
  }
  const downloaded = Buffer.from(await downloadRes.arrayBuffer());
  if (!downloaded.equals(fileContent)) {
    fail("download file", `content mismatch (${downloaded.length} bytes)`);
  }
  pass("GET /api/orders/[id]/file", `${downloaded.length} bytes`);

  console.log("\nAll blob tests passed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
