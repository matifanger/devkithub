export interface ActivateLicenseResponse {
  valid: boolean;
  license: {
    license_key: string;
    created_at: string;
    updated_at: string;
  };
}
