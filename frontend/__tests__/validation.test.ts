import { validateUrl, validateEmail, validatePassword } from "@/lib/validation";

describe("URL Validation", () => {
  test("validates correct URLs", () => {
    const result = validateUrl("example.com");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("https://example.com");
  });

  test("validates URLs with protocol", () => {
    const result = validateUrl("https://example.com");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("https://example.com");
  });

  test("rejects empty URLs", () => {
    const result = validateUrl("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("URL is required");
  });

  test("rejects localhost URLs", () => {
    const result = validateUrl("localhost:3000");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Local and private URLs are not allowed");
  });

  test("rejects malicious URLs", () => {
    const result = validateUrl('javascript:alert("xss")');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid URL format");
  });
});

describe("Email Validation", () => {
  test("validates correct emails", () => {
    const result = validateEmail("test@example.com");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("test@example.com");
  });

  test("rejects invalid emails", () => {
    const result = validateEmail("invalid-email");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Please enter a valid email address");
  });

  test("rejects empty emails", () => {
    const result = validateEmail("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Email is required");
  });
});

describe("Password Validation", () => {
  test("validates strong passwords", () => {
    const result = validatePassword("password123");
    expect(result.isValid).toBe(true);
  });

  test("rejects short passwords", () => {
    const result = validatePassword("short");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Password must be at least 8 characters long");
  });

  test("rejects passwords without numbers", () => {
    const result = validatePassword("passwordonly");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      "Password must contain at least one letter and one number"
    );
  });
});
