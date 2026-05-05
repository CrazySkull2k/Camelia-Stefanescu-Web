export class InvalidOriginError extends Error {
  constructor(message = "Origin mismatch.") {
    super(message);
    this.name = "InvalidOriginError";
  }
}

export class RateLimitExceededError extends Error {
  constructor(message = "Prea multe incercari. Incearca din nou putin mai tarziu.") {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

export class InvalidUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUploadError";
  }
}
