declare module "@/lib/api" {
  import { AxiosInstance } from "axios";

  const apiClient: AxiosInstance;

  export interface AuthAPI {
    login: (email: string, password: string, remember?: boolean) => Promise<{ token: string, user: any }>;
    logout: () => Promise<void>;
    me: () => Promise<any>;
    updateProfile: (data: any) => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: (data: any) => Promise<any>;
  }

  export interface PatientAPI {
    list: (params?: any) => Promise<any>;
    get: (id: string | number, params?: any) => Promise<any>;
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
    update: (visitId: string | number, vitalId: string | number, data: any) => Promise<any>;
    listGlobal: (params?: any) => Promise<any>;
  }

  export interface InvestigationAPI {
    list: (visitId: string | number) => Promise<any>;
    store: (visitId: string | number, data: any) => Promise<any>;
    update: (visitId: string | number, invId: string | number, data: any) => Promise<any>;
    listGlobal: (params?: any) => Promise<any>;
    storeStandalone: (data: any) => Promise<any>;
    updateStandalone: (id: string | number, data: any) => Promise<any>;
    get: (id: string | number) => Promise<any>;
  }

  export interface PrescriptionAPI {
    list: (visitId: string | number) => Promise<any>;
    store: (visitId: string | number, data: any) => Promise<any>;
    update: (visitId: string | number, rxId: string | number, data: any) => Promise<any>;
    listGlobal: (params?: any) => Promise<any>;
    storeStandalone: (data: any) => Promise<any>;
    updateStandalone: (id: string | number, data: any) => Promise<any>;
    get: (id: string | number) => Promise<any>;
  }

  export interface BillingAPI {
    list: (params?: any) => Promise<any>;
    get: (id: string | number) => Promise<any>;
    store: (data: any) => Promise<any>;
  }

  export interface PaymentAPI {
    store: (billId: string | number, data: any) => Promise<any>;
    list: (billId: string | number) => Promise<any>;
    payVisit: (visitId: string | number, data: any) => Promise<any>;
  }

  export interface MedicineAPI {
    list: (params?: any) => Promise<any>;
    store: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
    updateCategory: (old_name: string, new_name: string) => Promise<any>;
    deleteCategory: (name: string) => Promise<any>;
  }

  export interface StockAPI {
    list: (params?: any) => Promise<any>;
    store: (data: any) => Promise<any>;
    adjust: (id: string | number, adjustment: number) => Promise<any>;
  }

  export interface LabTestAPI {
    list: (params?: any) => Promise<any>;
    store: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
    bulkStore: (data: any) => Promise<any>;
    delete: (id: string | number) => Promise<any>;
  }

  export interface SalesAPI {
    report: (params?: any) => Promise<any>;
    dailyDetails: (date: string) => Promise<any>;
  }

  export interface DashboardAPI {
    get: () => Promise<any>;
  }

  export interface AdminAPI {
    getAdmins(params?: any): Promise<any>;
    createAdmin(data: any): Promise<any>;
    toggleStatus(id: string | number): Promise<any>;
  }

  export interface ActivityLogAPI {
    getLogs(params: any): Promise<any>;
  }

  export const authAPI: AuthAPI;
  export const patientAPI: PatientAPI;
  export const visitAPI: VisitAPI;
  export const vitalAPI: VitalAPI;
  export const investigationAPI: InvestigationAPI;
  export const prescriptionAPI: PrescriptionAPI;
  export const medicineAPI: MedicineAPI;
  export const stockAPI: StockAPI;
  export const billingAPI: BillingAPI;
  export const paymentAPI: PaymentAPI;
  export const dashboardAPI: DashboardAPI;
  export const labTestAPI: LabTestAPI;
  export const salesAPI: SalesAPI;
  export const adminAPI: AdminAPI;
  export const activityLogAPI: ActivityLogAPI;

  export default apiClient;
}
