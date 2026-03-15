declare module "@/lib/api" {
  import { AxiosInstance } from "axios";

  const apiClient: AxiosInstance;

  export interface AuthAPI {
    login: (email: string, password: string) => Promise<{ token: string, user: any }>;
    logout: () => Promise<void>;
    me: () => Promise<any>;
    updateProfile: (data: any) => Promise<any>;
  }

  export interface PatientAPI {
    list: (params?: any) => Promise<any>;
    get: (id: string | number) => Promise<any>;
    store: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
  }

  export interface VisitAPI {
    list: (params?: any) => Promise<any>;
    store: (data: any) => Promise<any>;
  }

  export interface VitalAPI {
    list: (visitId: string | number) => Promise<any>;
    store: (visitId: string | number, data: any) => Promise<any>;
  }

  export interface InvestigationAPI {
    list: (visitId: string | number) => Promise<any>;
    store: (visitId: string | number, data: any) => Promise<any>;
    update: (visitId: string | number, invId: string | number, data: any) => Promise<any>;
  }

  export interface PrescriptionAPI {
    list: (visitId: string | number) => Promise<any>;
    store: (visitId: string | number, data: any) => Promise<any>;
  }

  export interface MedicineAPI {
    list: (params?: any) => Promise<any>;
    store: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
  }

  export interface StockAPI {
    list: (params?: any) => Promise<any>;
    store: (data: any) => Promise<any>;
  }

  export interface DashboardAPI {
    get: () => Promise<any>;
  }

  export const authAPI: AuthAPI;
  export const patientAPI: PatientAPI;
  export const visitAPI: VisitAPI;
  export const vitalAPI: VitalAPI;
  export const investigationAPI: InvestigationAPI;
  export const prescriptionAPI: PrescriptionAPI;
  export const medicineAPI: MedicineAPI;
  export const stockAPI: StockAPI;
  export const dashboardAPI: DashboardAPI;

  export default apiClient;
}
