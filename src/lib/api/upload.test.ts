import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetApiClientState } from "./client";
import {
  ALLOWED_UPLOAD_TYPES,
  checkUpload,
  MAX_UPLOAD_BYTES,
  uploadFile,
  UploadError,
} from "./upload";

/* uploadFile: upload-url → PUT with every signed header → complete. */

const STORAGE = "http://127.0.0.1:5901";
const SIGNED_HEADERS = {
  "Content-Type": "application/pdf",
  "Content-Length": "5",
  "x-amz-server-side-encryption": "AES256",
};

function envelope(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      success: status < 400,
      statusCode: status,
      message: "",
      data,
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

type Call = { url: string; init: RequestInit };

function mockFlow(options: { putStatus?: number; uploadUrl?: string } = {}) {
  const calls: Call[] = [];
  /* A reply object that throws if anything reads `key`. */
  const upload = {
    url:
      options.uploadUrl ??
      `${STORAGE}/nr-local/private/abc.pdf?X-Amz-Signature=sig`,
    method: "PUT",
    bucket: "nr-local",
    headers: SIGNED_HEADERS,
    expiresIn: 900,
  };
  const file = {
    id: "file-1",
    contentType: "application/pdf",
    status: "PENDING",
  };
  for (const target of [upload, file]) {
    Object.defineProperty(target, "key", {
      enumerable: false,
      get() {
        throw new Error("file.key must never be read");
      },
    });
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init: init ?? {} });
      if (url.endsWith("/files/upload-url")) {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            statusCode: 201,
            message: "",
            data: { file, upload },
          }),
        } as unknown as Response;
      }
      if (url.startsWith(STORAGE) || url.startsWith("https://elsewhere")) {
        return new Response(null, { status: options.putStatus ?? 200 });
      }
      if (url.includes("/files/file-1/complete")) {
        return envelope({ file: { id: "file-1", status: "UPLOADED" } }, 201);
      }
      return envelope(null, 404);
    }),
  );
  return calls;
}

const pdf = () =>
  new File(["%PDF-"], "synthetic.pdf", { type: "application/pdf" });

beforeEach(() => {
  resetApiClientState();
  vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", STORAGE);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("uploadFile", () => {
  it("runs upload-url, PUT and complete, and returns the file id", async () => {
    const calls = mockFlow();
    await expect(uploadFile(pdf())).resolves.toBe("file-1");
    expect(calls.map((c) => c.init.method)).toEqual(["POST", "PUT", "POST"]);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      filename: "synthetic.pdf",
      contentType: "application/pdf",
      size: 5,
    });
    expect(calls[2].url).toMatch(/\/files\/file-1\/complete$/);
  });

  it("forwards every signed header to the storage PUT, without cookies", async () => {
    const calls = mockFlow();
    await uploadFile(pdf());
    const put = calls[1];
    expect(put.init.headers).toEqual(SIGNED_HEADERS);
    expect(put.init.credentials).toBe("omit");
    expect(put.init.body).toBeInstanceOf(File);
  });

  it("asks for PUBLIC only when the caller does", async () => {
    const calls = mockFlow();
    await uploadFile(pdf(), { visibility: "PUBLIC" });
    expect(JSON.parse(String(calls[0].init.body)).visibility).toBe("PUBLIC");
  });

  it("fails when the storage PUT fails, and does not complete", async () => {
    const calls = mockFlow({ putStatus: 403 });
    await expect(uploadFile(pdf())).rejects.toMatchObject({
      reason: "storage_failed",
    });
    expect(calls).toHaveLength(2);
  });

  it("refuses a presigned URL for any host but the storage origin", async () => {
    const calls = mockFlow({ uploadUrl: "https://elsewhere.example/x" });
    await expect(uploadFile(pdf())).rejects.toMatchObject({
      reason: "bad_upload_url",
    });
    expect(calls).toHaveLength(1);
  });

  describe("in a production build", () => {
    beforeEach(() => vi.stubEnv("NODE_ENV", "production"));

    it("refuses every presigned URL when no storage origin is set", async () => {
      vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "");
      const calls = mockFlow({ uploadUrl: "https://elsewhere.example/x" });
      await expect(uploadFile(pdf())).rejects.toMatchObject({
        reason: "bad_upload_url",
      });
      expect(calls).toHaveLength(1);
    });

    it("refuses plain http to a storage host that is not this machine", async () => {
      vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "http://storage.example");
      const calls = mockFlow({ uploadUrl: "http://storage.example/b/x" });
      await expect(uploadFile(pdf())).rejects.toMatchObject({
        reason: "bad_upload_url",
      });
      expect(calls).toHaveLength(1);
    });

    it("accepts https to the configured storage origin", async () => {
      vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "https://elsewhere.example");
      const calls = mockFlow({
        uploadUrl: "https://elsewhere.example/b/x?X-Amz-Signature=s",
      });
      await expect(uploadFile(pdf())).resolves.toBe("file-1");
      expect(calls).toHaveLength(3);
    });

    it("still accepts the local storage stand-in over http", async () => {
      const calls = mockFlow();
      await expect(uploadFile(pdf())).resolves.toBe("file-1");
      expect(calls).toHaveLength(3);
    });
  });

  it("refuses SVG before any request", async () => {
    const calls = mockFlow();
    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    await expect(uploadFile(svg)).rejects.toBeInstanceOf(UploadError);
    await expect(uploadFile(svg)).rejects.toMatchObject({
      reason: "type_not_allowed",
    });
    expect(calls).toHaveLength(0);
  });

  it("refuses HTML before any request", async () => {
    const calls = mockFlow();
    const html = new File(["<p>"], "x.html", { type: "text/html" });
    await expect(uploadFile(html)).rejects.toMatchObject({
      reason: "type_not_allowed",
    });
    expect(calls).toHaveLength(0);
  });

  it("refuses a file over 10 MB before any request", async () => {
    const calls = mockFlow();
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.mp4", {
      type: "video/mp4",
    });
    await expect(uploadFile(big)).rejects.toMatchObject({
      reason: "too_large",
    });
    expect(calls).toHaveLength(0);
  });
});

describe("checkUpload", () => {
  it("accepts exactly 10 MB and the server's types", () => {
    expect(
      checkUpload({ type: "video/mp4", size: MAX_UPLOAD_BYTES }),
    ).toBeNull();
    for (const type of ALLOWED_UPLOAD_TYPES)
      expect(checkUpload({ type, size: 1 })).toBeNull();
  });

  it("has no SVG or HTML in the allowlist", () => {
    expect(ALLOWED_UPLOAD_TYPES).not.toContain("image/svg+xml");
    expect(ALLOWED_UPLOAD_TYPES).not.toContain("text/html");
  });

  it("refuses an empty file", () => {
    expect(checkUpload({ type: "application/pdf", size: 0 })).toBe("empty");
  });
});
