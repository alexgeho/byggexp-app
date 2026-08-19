// storage pulls native/ESM deps that jest can't transform; the pure helpers
// under test never touch it (only downloadAndShareDocument does).
import {
  getDocumentNameFromUrl,
  getFileExtension,
  isPdfDocument,
  isImageDocument,
  getDocumentName,
  getDocumentTypeMeta,
} from "../documentPreview";

jest.mock("../storage", () => ({
  getToken: jest.fn(() => Promise.resolve(null)),
}));

describe("getFileExtension", () => {
  it("returns the lowercased extension", () => {
    expect(getFileExtension("Photo.JPG")).toBe("jpg");
    expect(getFileExtension("report.final.pdf")).toBe("pdf");
  });

  it("returns an empty string when there is no extension", () => {
    expect(getFileExtension("noextension")).toBe("");
    expect(getFileExtension("")).toBe("");
  });
});

describe("getDocumentNameFromUrl", () => {
  it("extracts the file name from a URL, ignoring the query string", () => {
    expect(getDocumentNameFromUrl("https://x/uploads/file.pdf?token=abc")).toBe(
      "file.pdf",
    );
  });

  it("decodes percent-encoded names", () => {
    expect(getDocumentNameFromUrl("https://x/my%20file.png")).toBe(
      "my file.png",
    );
  });

  it("uses the fallback for empty input", () => {
    expect(getDocumentNameFromUrl("")).toBe("Document");
    expect(getDocumentNameFromUrl(null, "Fallback")).toBe("Fallback");
  });
});

describe("isPdfDocument", () => {
  it("detects a pdf by mime type or extension", () => {
    expect(isPdfDocument({ mimeType: "application/pdf" })).toBe(true);
    expect(isPdfDocument({ name: "invoice.pdf" })).toBe(true);
  });

  it("is false for non-pdf documents", () => {
    expect(isPdfDocument({ name: "photo.png" })).toBe(false);
    expect(isPdfDocument({})).toBe(false);
  });
});

describe("isImageDocument", () => {
  it("detects an image by mime type or extension", () => {
    expect(isImageDocument({ mimeType: "image/png" })).toBe(true);
    expect(isImageDocument({ name: "photo.JPG" })).toBe(true);
    expect(isImageDocument({ name: "scan.heic" })).toBe(true);
  });

  it("is false for non-image documents", () => {
    expect(isImageDocument({ name: "invoice.pdf" })).toBe(false);
    expect(isImageDocument({})).toBe(false);
  });
});

describe("getDocumentName", () => {
  it("takes the last path segment of a raw URL string", () => {
    expect(getDocumentName("https://x/docs/file.pdf")).toBe("file.pdf");
  });

  it("uses the object name when present", () => {
    expect(getDocumentName({ name: "contract.docx" })).toBe("contract.docx");
  });

  it("falls back to a numbered document name", () => {
    expect(getDocumentName({}, 2)).toBe("Document 3");
  });
});

describe("getDocumentTypeMeta", () => {
  it("labels images with their extension and image icon", () => {
    expect(getDocumentTypeMeta({ name: "photo.png" })).toEqual({
      icon: "image",
      label: "PNG",
    });
  });

  it("labels pdf documents", () => {
    expect(getDocumentTypeMeta({ name: "a.pdf" })).toEqual({
      icon: "file-text",
      label: "PDF",
    });
  });

  it("labels office documents", () => {
    expect(getDocumentTypeMeta({ name: "sheet.xlsx" })).toEqual({
      icon: "grid",
      label: "XLSX",
    });
    expect(getDocumentTypeMeta({ name: "doc.docx" })).toEqual({
      icon: "file-text",
      label: "DOCX",
    });
  });

  it("falls back to a generic file chip when the type is unknown", () => {
    expect(getDocumentTypeMeta({ name: "archive" })).toEqual({
      icon: "file",
      label: "FILE",
    });
  });
});
