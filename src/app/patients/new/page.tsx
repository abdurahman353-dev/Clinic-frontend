"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { patientAPI, settingsAPI } from "@/lib/api";
import { patientSchema, type PatientInput } from "@/lib/validation";
import { ArrowLeft, Save, Loader2, AlertCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState, useEffect } from "react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

export default function NewPatientPage() {
  const router = useRouter();
  const [globalFee, setGlobalFee] = useState<number | null>(null);

  useEffect(() => {
    settingsAPI.get().then((res: any) => {
      const fee = res?.data?.consultation_fee ?? res?.consultation_fee;
      setGlobalFee(fee !== undefined && fee !== null ? parseFloat(String(fee)) : 500);
    }).catch(() => setGlobalFee(500));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<PatientInput, any>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      patient_type: "outpatient",
      gender: "male",
    },
  });

  const calculateAge = (dobString: string) => {
    if (!dobString) return;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    setValue("age", age, { shouldValidate: true });
  };

  const sanitizePhone = (val: string) => val.replace(/[^\d\s\+\-\(\)]/g, "");

  const onSubmit = async (data: PatientInput) => {
    try {
      // Clean up empty optional strings before sending
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== "" && v !== undefined && v !== null)
      );
      await patientAPI.store(payload);
      toast.success("Patient registered successfully");
      router.push("/patients");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } }; message?: string };
      if (e.response?.status === 422 && e.response?.data?.errors) {
        const firstKey = Object.keys(e.response.data.errors)[0];
        toast.error(e.response.data.errors[firstKey][0]);
      } else {
        toast.error(e.response?.data?.message || e.message || "Failed to create patient");
      }
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? "border-red-400 bg-red-50 focus:ring-red-400" : "border-slate-300 bg-white"
    }`;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/patients"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Patient</h1>
          <p className="text-slate-500 mt-1">Enter the patient&apos;s personal and medical details</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ─── General Information ─────────────────────────── */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-slate-900 mb-4 pb-2 border-b border-slate-100">
              General Information
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("patient_type")}
              className={inputClass(!!errors.patient_type)}
            >
              <option value="outpatient">Outpatient</option>
              <option value="inpatient">Inpatient</option>
            </select>
            <FieldError message={errors.patient_type?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              Consultation Fee (KSh)
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase font-bold tracking-wider">Auto-Billed</span>
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                Set by clinic admin
              </span>
              <span className="text-primary-700 font-black text-base">
                {globalFee !== null ? `KSh ${globalFee.toLocaleString()}` : "Loading..."}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Auto-billed to this patient on registration. Change it in Admin Management.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className={inputClass(!!errors.name)}
              placeholder="e.g. John Doe"
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID Number</label>
            <input
              type="text"
              {...register("id_number")}
              className={inputClass(!!errors.id_number)}
              placeholder="National ID or passport number"
            />
            <FieldError message={errors.id_number?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
            <input
              type="date"
              {...register("dob", {
                onChange: (e) => calculateAge(e.target.value),
              })}
              max={new Date().toISOString().split("T")[0]}
              className={inputClass(!!errors.dob)}
            />
            <FieldError message={errors.dob?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Age (Years) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              max={150}
              {...register("age")}
              className={inputClass(!!errors.age)}
              placeholder="e.g. 34"
            />
            <FieldError message={errors.age?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select {...register("gender")} className={inputClass(!!errors.gender)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <FieldError message={errors.gender?.message} />
          </div>

          {/* ─── Contact Details ──────────────────────────────── */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Contact Details
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register("phone", {
                onChange: (e) => {
                  e.target.value = sanitizePhone(e.target.value);
                },
              })}
              className={inputClass(!!errors.phone)}
              placeholder="e.g. 0712 345 678"
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              {...register("email")}
              className={inputClass(!!errors.email)}
              placeholder="e.g. john@example.com"
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
            <textarea
              rows={2}
              {...register("address")}
              className={inputClass(!!errors.address)}
              placeholder="Full residential address..."
            />
            <FieldError message={errors.address?.message} />
          </div>

          {/* ─── Emergency & Medical ──────────────────────────── */}
          <div className="md:col-span-2 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                Emergency Contact
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Next of Kin Name</label>
                  <input
                    type="text"
                    {...register("next_of_kin")}
                    className={inputClass(!!errors.next_of_kin)}
                  />
                  <FieldError message={errors.next_of_kin?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Next of Kin Phone</label>
                  <input
                    type="tel"
                    {...register("next_of_kin_phone", {
                      onChange: (e) => {
                        e.target.value = sanitizePhone(e.target.value);
                      },
                    })}
                    className={inputClass(!!errors.next_of_kin_phone)}
                  />
                  <FieldError message={errors.next_of_kin_phone?.message} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                Medical History
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                  <select {...register("blood_group")} className={inputClass(!!errors.blood_group)}>
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  <FieldError message={errors.blood_group?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies</label>
                  <textarea
                    rows={2}
                    {...register("allergies")}
                    className={inputClass(!!errors.allergies)}
                    placeholder="List any drug, food, or environmental allergies..."
                  />
                  <FieldError message={errors.allergies?.message} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link
            href="/patients"
            className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
