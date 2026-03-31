import { z } from "zod";

// ─── Shared helpers ─────────────────────────────────────────────────────────
const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

// ─── Auth schemas ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Patient schema ────────────────────────────────────────────────────────────
export const patientSchema = z.object({
  patient_type: z.enum(["inpatient", "outpatient"], { message: "Patient type is required" }),
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(255, "Name is too long")
    .regex(/^[\p{L}\s'\-]+$/u, "Name can only contain letters, spaces, hyphens and apostrophes"),
  id_number: z.string().max(50, "ID number is too long").optional().or(z.literal("")),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(phoneRegex, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address").max(255).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"], { message: "Gender is required" }),
  dob: z.string().optional().or(z.literal("")),
  age: z.coerce.number().int().min(0, "Age cannot be negative").max(150, "Age seems unrealistic").optional(),
  blood_group: z.string().max(5).optional().or(z.literal("")),
  address: z.string().max(1000, "Address is too long").optional().or(z.literal("")),
  allergies: z.string().max(2000, "Allergies text is too long").optional().or(z.literal("")),
  next_of_kin: z.string().max(255, "Name is too long").optional().or(z.literal("")),
  next_of_kin_phone: z
    .string()
    .max(20)
    .regex(phoneRegex, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  consultation_fee: z.coerce
    .number()
    .min(0, "Fee cannot be negative")
    .max(1_000_000, "Fee value is unrealistic")
    .optional(),
});
export type PatientInput = z.infer<typeof patientSchema>;

// ─── Visit schema ─────────────────────────────────────────────────────────────
export const visitSchema = z.object({
  patient_id: z.number().int().positive("Patient is required"),
  doctor_id: z.number().int().positive().optional(),
  status: z.enum(["open", "completed", "billed", "paid"]).optional(),
  consultation_fee: z.coerce.number().min(0).max(1_000_000).optional(),
});
export type VisitInput = z.infer<typeof visitSchema>;

// ─── Vital Sign schema ────────────────────────────────────────────────────────
export const vitalSignSchema = z.object({
  temperature: z.string().max(50).optional().or(z.literal("")),
  blood_pressure: z.string().max(50).optional().or(z.literal("")),
  pulse_rate: z.string().max(50).optional().or(z.literal("")),
  respiratory_rate: z.string().max(50).optional().or(z.literal("")),
  oxygen_saturation: z.string().max(50).optional().or(z.literal("")),
  weight: z.string().max(50).optional().or(z.literal("")),
  height: z.string().max(50).optional().or(z.literal("")),
  bmi: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes are too long").optional().or(z.literal("")),
  cost: z.coerce.number().min(0).max(1_000_000).optional(),
});
export type VitalSignInput = z.infer<typeof vitalSignSchema>;

// ─── Investigation schema ─────────────────────────────────────────────────────
export const investigationSchema = z.object({
  type: z.string().min(1, "Investigation type is required").max(100),
  name: z.string().min(1, "Investigation name is required").max(255),
  result: z.string().max(5000).optional().or(z.literal("")),
  cost: z.coerce.number().min(0).max(1_000_000).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["pending", "completed"]).optional(),
  ordered_by: z.string().max(255).optional().or(z.literal("")),
});
export type InvestigationInput = z.infer<typeof investigationSchema>;

// ─── Prescription schema ──────────────────────────────────────────────────────
export const prescriptionItemSchema = z.object({
  medicine_id: z.number().int().positive("Medicine is required"),
  dosage: z.string().min(1, "Dosage is required").max(100),
  frequency: z.string().max(100).optional().or(z.literal("")),
  duration: z.string().min(1, "Duration is required").max(100),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10000),
  instructions: z.string().max(500).optional().or(z.literal("")),
});

export const prescriptionSchema = z.object({
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(prescriptionItemSchema).min(1, "At least one item is required").max(50),
});
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;

// ─── Payment schema ───────────────────────────────────────────────────────────
export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero").max(10_000_000),
  payment_method: z.enum(["cash", "mpesa", "insurance", "bank_transfer", "card"], {
    message: "Payment method is required",
  }),
  transaction_reference: z.string().max(255).optional().or(z.literal("")),
  discount_amount: z.coerce.number().min(0).max(10_000_000).optional(),
  discount_type: z.enum(["fixed", "percentage"]).optional(),
  discount_reason: z.string().max(500).optional().or(z.literal("")),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

// ─── Medicine schema ──────────────────────────────────────────────────────────
export const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required").max(255),
  category: z.string().max(255).optional().or(z.literal("")),
  unit_price: z.coerce.number().min(0, "Price cannot be negative").max(1_000_000),
  description: z.string().max(2000).optional().or(z.literal("")),
  size: z.string().max(100).optional().or(z.literal("")),
  unit: z.string().max(100).optional().or(z.literal("")),
  dosage_form: z.string().max(100).optional().or(z.literal("")),
  initial_quantity: z.coerce.number().int().min(0).optional(),
  minimum_stock: z.coerce.number().int().min(0).optional(),
  reorder_level: z.coerce.number().int().min(0).optional(),
  batch_number: z.string().max(100).optional().or(z.literal("")),
  expiry_date: z.string().optional().or(z.literal("")),
});
export type MedicineInput = z.infer<typeof medicineSchema>;

// ─── Utility: format Zod errors into flat field-message map ──────────────────
export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
