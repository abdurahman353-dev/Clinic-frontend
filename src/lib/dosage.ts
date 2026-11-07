export type MedicineLike = {
  size?: string | null;
  unit?: string | null;
  dosage_form?: string | null;
};

export type DosageItem = {
  dosage?: string | number | null;
  frequency?: string | null;
  duration?: string | number | null;
  quantity?: string | number | null;
};

type Amount = {
  value: number;
  unit: string;
};

const MASS_TO_MG: Record<string, number> = {
  mcg: 0.001,
  ug: 0.001,
  mg: 1,
  g: 1000,
  kg: 1000000,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
};

const FREQUENCY: Record<string, number> = {
  "once a day": 1,
  "twice a day": 2,
  "three times a day": 3,
  "four times a day": 4,
  "every 4 hours": 6,
  "every 6 hours": 4,
  "every 8 hours": 3,
  "every 12 hours": 2,
  "at bedtime": 1,
};

function normalizeUnit(value: string) {
  return value.toLowerCase().replace(/µ|μ/g, "u").replace(/\./g, "");
}

function parseAmount(value: unknown): Amount | null {
  const text = String(value ?? "").trim().toLowerCase().replace(/µ|μ/g, "u");
  if (!text) return null;

  const match = text.match(/(\d+(?:\.\d+)?)\s*([a-z%]+)?/);
  if (!match) return null;

  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return null;

  return {
    value: amount,
    unit: normalizeUnit(match[2] || ""),
  };
}

function parseStrength(med?: MedicineLike | null): Amount | null {
  return parseAmount(med?.size);
}

function toMilligrams(amount: Amount) {
  const factor = MASS_TO_MG[amount.unit];
  return factor ? amount.value * factor : null;
}

function toMillilitres(amount: Amount) {
  const factor = VOLUME_TO_ML[amount.unit];
  return factor ? amount.value * factor : null;
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.max(0.1, Math.round(value * 100) / 100);
}

export function getFormCategory(med?: MedicineLike | null): "volume" | "manual" | "exact" {
  if (!med) return "exact";
  const form = (med.dosage_form || "").toLowerCase();
  const unit = (med.unit || "").toLowerCase();

  const volumeForms = ["bottle", "syrup", "suspension", "liquid"];
  const volumeUnits = ["bottle"];
  const manualForms = ["tube", "ointment", "cream"];
  const manualUnits = ["tube"];

  if (volumeForms.some((value) => form.includes(value)) || volumeUnits.includes(unit)) return "volume";
  if (manualForms.some((value) => form.includes(value)) || manualUnits.includes(unit)) return "manual";

  return "exact";
}

export function getMedicineStrengthLabel(med?: MedicineLike | null) {
  const strength = med?.size?.trim();
  if (strength) return strength;

  const unit = med?.unit?.trim();
  return unit ? `per ${unit}` : "N/A";
}

export function calculateQuantity(item: DosageItem, med?: MedicineLike | null, currentQuantity: unknown = 1) {
  const category = getFormCategory(med);
  if (category === "manual") return normalizeQuantity(Number(currentQuantity) || 1);

  const dose = parseAmount(item.dosage);
  const strength = parseStrength(med);
  const frequency = FREQUENCY[(item.frequency || "").toLowerCase()] || 0;
  const duration = Number.parseFloat(String(item.duration ?? "")) || 0;
  const totalDoses = frequency * duration;

  if (category === "volume") {
    const doseMilligrams = dose ? toMilligrams(dose) : null;
    const strengthMilligrams = strength ? toMilligrams(strength) : null;

    if (doseMilligrams !== null && strengthMilligrams) {
      return normalizeQuantity((doseMilligrams * totalDoses) / strengthMilligrams);
    }

    const doseMillilitres = dose ? toMillilitres(dose) : null;
    const bottleMillilitres = strength ? toMillilitres(strength) : null;

    if (doseMillilitres !== null && bottleMillilitres) {
      return Math.max(1, Math.ceil((doseMillilitres * totalDoses) / bottleMillilitres));
    }

    const fallbackBottleSize = Number.parseFloat(med?.size?.match(/(\d+(?:\.\d+)?)/)?.[0] || "1");
    return Math.max(1, Math.ceil(((dose?.value || 0) * totalDoses) / (fallbackBottleSize || 1)));
  }

  const doseMilligrams = dose ? toMilligrams(dose) : null;
  const strengthMilligrams = strength ? toMilligrams(strength) : null;

  if (doseMilligrams !== null && strengthMilligrams) {
    return normalizeQuantity((doseMilligrams * totalDoses) / strengthMilligrams);
  }

  return normalizeQuantity((dose?.value || 0) * totalDoses);
}
