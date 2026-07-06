const API_BASE_URL = "https://anomaly-api-1ggm.onrender.com";

export interface UploadStatus {
  loaded_files: string[];
  missing_files: string[];
  ready: boolean;
  rows_total: number;
  message: string;
}

export interface BillRange {
  min_month: number | null;
  max_month: number | null;
  n_months: number;
  per_provider: {
    PEA?: {
      min_month: number;
      max_month: number;
      n_months: number;
    };
    MEA?: {
      min_month: number;
      max_month: number;
      n_months: number;
    };
  };
}

export interface DuplicateItem {
  Site_ID: string;
  occurrences: number;
  providers: string[];
  companies: string[];
}

export interface Duplicates {
  malformed_site_ids: string[];
  malformed_count: number;
  duplicate_site_ids: DuplicateItem[];
  duplicate_count: number;
}

export interface CommonSites {
  within_pea?: Record<string, { count: number; site_ids: string[] }>;
  within_mea?: Record<string, { count: number; site_ids: string[] }>;
  pea_mea_cross_common?: { count: number; site_ids: string[] };
  mea_all_three_common?: { count: number; site_ids: string[] };
}

export interface SiteTypes {
  PEA?: Record<string, number>;
  MEA?: Record<string, number>;
}

export interface MaintenanceSite {
  site_id: string;
  provider: "PEA" | "MEA";
  company: "BFKT" | "TUC" | "TMV";
  site_type: string;
  bill_amount: number;
  last_maintenance_month: string;
}

export interface MaintenanceData {
  total_maintenance_rows: number;
  unique_amounts: number;
  value_counts: Array<{ amount: number; count: number }>;
  maintenance_sites_last_6_months: MaintenanceSite[];
  maintenance_site_count: number;
}

export interface LoadReport {
  provider: string;
  company: string;
  rows_raw: number;
  rows_after_clean: number;
  removed_rows: number;
  notes: string[];
}

export interface ErrorRates {
  total_rows: number;
  zero_bill_rate: number;
  bill_without_kwh_rate: number;
  kwh_without_bill_rate: number;
  missing_kwh_rate: number;
  negative_value_rows: number;
  load_reports: Record<string, LoadReport>;
}

export interface EDASummary {
  bill_range: BillRange;
  duplicates: Duplicates;
  common_sites: CommonSites;
  site_types: SiteTypes;
  last_month_missing?: Record<string, unknown>;
  maintenance_sites: MaintenanceData;
  error_rates: ErrorRates;
}

export interface SiteTrendPoint {
  month: number;
  value: number | null;
}

export interface SiteTrend {
  site_id: string;
  found: boolean;
  provider: string | null;
  company: string | null;
  site_type: string | null;
  metric: "kwh" | "bill_amount" | null;
  series: SiteTrendPoint[];
}

class BillingEDAClient {
  private baseUrl = API_BASE_URL;

  async checkHealth() {
    const res = await fetch(`${this.baseUrl}/api/health`);
    return res.json();
  }

  async getUploadStatus(): Promise<UploadStatus> {
    const res = await fetch(`${this.baseUrl}/api/upload/status`);
    if (!res.ok) throw new Error(`Upload status failed: ${res.statusText}`);
    return res.json();
  }

  async uploadFiles(
    files: Record<string, File | null>
  ): Promise<UploadStatus> {
    const form = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) form.append(key, file);
    });

    const res = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json();
  }

  async getEDASummary(): Promise<EDASummary> {
    const res = await fetch(`${this.baseUrl}/api/eda/summary`);
    if (res.status === 409)
      throw new Error("Data not ready. Please upload files first.");
    if (!res.ok) throw new Error(`EDA summary failed: ${res.statusText}`);
    return res.json();
  }

  async getBillRange(): Promise<BillRange> {
    const res = await fetch(`${this.baseUrl}/api/eda/bill-range`);
    if (!res.ok) throw new Error(`Bill range failed: ${res.statusText}`);
    return res.json();
  }

  async getDuplicates(): Promise<Duplicates> {
    const res = await fetch(`${this.baseUrl}/api/eda/duplicates`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Duplicates failed: ${res.statusText}`);
    return res.json();
  }

  async getCommonSites(): Promise<CommonSites> {
    const res = await fetch(`${this.baseUrl}/api/eda/common-sites`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Common sites failed: ${res.statusText}`);
    return res.json();
  }

  async getSiteTypes(): Promise<SiteTypes> {
    const res = await fetch(`${this.baseUrl}/api/eda/site-types`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Site types failed: ${res.statusText}`);
    return res.json();
  }

  async getMaintenanceSites(): Promise<MaintenanceData> {
    const res = await fetch(`${this.baseUrl}/api/eda/maintenance-sites`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Maintenance sites failed: ${res.statusText}`);
    return res.json();
  }

  async getErrorRates(): Promise<ErrorRates> {
    const res = await fetch(`${this.baseUrl}/api/eda/error-rates`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Error rates failed: ${res.statusText}`);
    return res.json();
  }

  async getSites(provider?: string): Promise<{ site_ids: string[] }> {
    const query = provider ? `?provider=${provider}` : "";
    const res = await fetch(`${this.baseUrl}/api/sites${query}`);
    if (!res.ok) throw new Error(`Sites failed: ${res.statusText}`);
    return res.json();
  }

  async getSiteTrend(
    siteId: string,
    metric: "kwh" | "bill_amount" = "kwh",
    startMonth?: number,
    endMonth?: number
  ): Promise<SiteTrend> {
    const params = new URLSearchParams({ metric });
    if (startMonth) params.append("start_month", startMonth.toString());
    if (endMonth) params.append("end_month", endMonth.toString());

    const res = await fetch(
      `${this.baseUrl}/api/site/${encodeURIComponent(siteId)}/trend?${params}`
    );
    if (!res.ok) throw new Error(`Site trend failed: ${res.statusText}`);
    return res.json();
  }
}

export const api = new BillingEDAClient();
