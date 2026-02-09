// server/src/utils/validator.ts

export type ValidationRule = (value: any) => string | null;

export class CustomValidator {
  private errors: Record<string, string[]> = {};
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  // Helper untuk menambahkan error
  private addError(field: string, message: string) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }

  // --- Rules ---

  // Cek Wajib isi
  required(field: string, message = "Field ini wajib diisi") {
    const val = this.data[field];
    if (val === undefined || val === null || val === "" || (typeof val === 'string' && val.trim() === '')) {
      this.addError(field, message);
    }
    return this;
  }

  // Cek String
  isString(field: string, message = "Harus berupa text") {
    if (this.data[field] && typeof this.data[field] !== 'string') {
      this.addError(field, message);
    }
    return this;
  }

  // Cek Min Length
  min(field: string, length: number, message?: string) {
    const val = this.data[field];
    if (typeof val === 'string' && val.length < length) {
      this.addError(field, message || `Minimal ${length} karakter`);
    }
    return this;
  }

  // Cek Email Format (Regex native)
  isEmail(field: string, message = "Format email tidak valid") {
    const val = this.data[field];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && typeof val === 'string' && !emailRegex.test(val)) {
      this.addError(field, message);
    }
    return this;
  }

  // Cek Enum (Untuk Role)
  isIn(field: string, allowed: string[], message = "Pilihan tidak valid") {
    const val = this.data[field];
    if (val && !allowed.includes(val)) {
      this.addError(field, message);
    }
    return this;
  }

  // --- Finalizer ---

  validate() {
    const isValid = Object.keys(this.errors).length === 0;
    return {
      isValid,
      errors: this.errors,
      data: this.data // Return data yang sudah "bersih" (konsepnya)
    };
  }
}