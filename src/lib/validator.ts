export interface Field {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "color" | "select" | "file" | "url";
  required: boolean;
  options?: string[];
}

export type ValidationErrors = Record<string, string>;

const HEX_REGEX = /^#([0-9A-Fa-f]{6})$/;

const URL_PATTERNS: Record<string, RegExp> = {
  github: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/,
  linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
  drive: /^(https?:\/\/)?(drive\.google\.com)\/.*$/,
  any: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
};

function isPastDate(value: string): boolean {
  const d = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function validateField(field: Field, value: unknown): string | null {
  const empty = value === undefined || value === null || value === "";
  if (field.required && empty) return "Trường này là bắt buộc";
  if (empty) return null;

  switch (field.type) {
    case "text": {
      const s = String(value);
      if (s.length > 200) return "Tối đa 200 ký tự";
      return null;
    }
    case "number": {
      const n = Number(value);
      if (Number.isNaN(n)) return "Giá trị phải là số";
      if (n < 0 || n > 100) return "Giá trị phải nằm trong khoảng 0 - 100";
      return null;
    }
    case "date": {
      const s = String(value);
      if (isPastDate(s)) return "Không được chọn ngày trong quá khứ";
      return null;
    }
    case "color": {
      if (!HEX_REGEX.test(String(value))) return "Mã màu phải đúng định dạng HEX (#RRGGBB)";
      return null;
    }
    case "file": {
      return null;
    }
    case "url": {
      const s = String(value);
      const platform = (field.options as any)?.[0] || 'any';
      const pattern = URL_PATTERNS[platform] || URL_PATTERNS.any;
      if (!pattern.test(s)) {
        const platformName = platform === 'any' ? 'URL' : platform.charAt(0).toUpperCase() + platform.slice(1);
        return `Vui lòng nhập đúng định dạng link ${platformName}`;
      }
      return null;
    }
    case "select": {
      const opts = (field.options as unknown as string[]) || [];
      if (!opts.includes(String(value))) return "Giá trị không hợp lệ";
      return null;
    }
  }
  return null;
}

export function validateForm(fields: Field[], answers: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const f of fields) {
    const err = validateField(f, answers[f.id]);
    if (err) errors[f.id] = err;
  }
  return errors;
}