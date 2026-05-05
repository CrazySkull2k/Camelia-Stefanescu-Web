import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvalidUploadError } from "@/lib/security/errors";

const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: mockFrom,
    storage: {
      from: () => ({
        remove: mockStorageRemove,
        upload: mockStorageUpload,
      }),
    },
  }),
}));

describe("patient analyses hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockOrder.mockResolvedValue({
      data: [
        {
          category_key: "hemoleucograma-completa",
          category_label: "Hemoleucograma completa",
          content_type: "application/pdf",
          created_at: "2026-05-05T10:00:00.000Z",
          file_size: 1024,
          id: "11111111-1111-1111-1111-111111111111",
          original_filename: "analiza.pdf",
        },
      ],
      error: null,
    });
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("returns only same-origin hrefs for listed uploads", async () => {
    const { listPatientAnalysisUploads } = await import(
      "@/modules/patients/analyses"
    );

    const uploads = await listPatientAnalysisUploads("patient-1");

    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({
      downloadHref:
        "/cont/analize/document/11111111-1111-1111-1111-111111111111/download",
      previewHref:
        "/cont/analize/document/11111111-1111-1111-1111-111111111111",
    });
    expect("signedUrl" in uploads[0]).toBe(false);
    expect("storagePath" in uploads[0]).toBe(false);
    expect("storageBucket" in uploads[0]).toBe(false);
    expect("patientId" in uploads[0]).toBe(false);
  });

  it("rejects spoofed uploads even when filename and MIME claim pdf", async () => {
    const { uploadPatientAnalysis } = await import(
      "@/modules/patients/analyses"
    );

    const file = new File([Buffer.from("not a real pdf")], "fake.pdf", {
      type: "application/pdf",
    });

    await expect(
      uploadPatientAnalysis({
        categoryKey: "hemoleucograma-completa",
        file,
        patientId: "patient-1",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      name: "InvalidUploadError",
    } satisfies Partial<InvalidUploadError>);
  });
});
