import type {
  Budget,
  BudgetProgress,
  MonthlyFinancials,
  MonthlyStats,
  Summary,
  Transaction,
  UploadResponse,
  YearlyStats,
  YearsResponse,
  MonthsResponse,
  CategoryYearlyStats,
  PreviewUploadResponse,
  TransactionPreview,
  InsightsResponse,
} from "@/types/api";
import type { Asset, AssetSummary } from "@/types/asset";

type CategoryUpdate =
  | { action: "addCategory"; name: string }
  | { action: "deleteCategory"; name: string }
  | { action: "addTag"; category: string; tag: string }
  | { action: "deleteTag"; category: string; tag: string };

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions<T = undefined> = {
  method?: HttpMethod;
  data?: T;
};

export class ApiClient {
  private async request<TResponse, TRequest = unknown>(
    endpoint: string,
    { method = "GET", data }: RequestOptions<TRequest> = {},
  ): Promise<TResponse> {
    try {
      const url =
        method === "GET" && data
          ? `${endpoint}?${new URLSearchParams(data as Record<string, string>).toString()}`
          : endpoint;

      console.log(`[API] ${method} ${url}`, method !== "GET" ? { data } : "");

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method !== "GET" && data && { body: JSON.stringify(data) }),
      });

      console.log(`[API] ${method} ${url} - Status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (error: unknown) {
          // Ignore JSON parse error
          console.error("Error parsing error response:", error);
        }
        console.error(
          `[API Error] ${method} ${url} - ${response.status}: ${errorMessage}`,
        );
        throw new Error(errorMessage);
      }

      // For 204 No Content responses
      if (response.status === 204) return undefined as TResponse;

      const responseData = (await response.json()) as TResponse;
      console.log(`[API Response] ${method} ${url}`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[API Request Error] ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  // ========== Assets ==========
  async getAssets(): Promise<Asset[]> {
    return this.request<Asset[]>("/api/assets");
  }

  async createAssets(assets: Asset[]): Promise<void> {
    return this.request<void, Asset[]>("/api/assets", {
      method: "POST",
      data: assets,
    });
  }

  async getAssetsSummary(): Promise<AssetSummary> {
    return this.request<AssetSummary>("/api/assets/summary");
  }

  // ========== Budget ==========
  async getBudget(year?: number): Promise<Budget> {
    try {
      console.log("[API] Fetching budget for year:", year);
      const url = "/api/budget" + (year !== undefined ? `?year=${year}` : "");
      const result = await this.request<Budget>(url);
      console.log("[API] Budget data received:", result);
      return result;
    } catch (error) {
      console.error("Error in getBudget:", error);
      throw error;
    }
  }

  async createBudget(
    year: number,
    total: number,
    categories: Record<string, number>,
  ): Promise<void> {
    return this.request<
      void,
      { year: number; total: number; categories: Record<string, number> }
    >("/api/budget", {
      method: "POST",
      data: { year, total, categories },
    });
  }

  // ========== Monthly Stats ==========
  async getMonthlyStats(
    year: number,
    month: number,
    owner?: string,
  ): Promise<MonthlyStats> {
    let url = `/api/stats/monthly/${year}/${month}`;

    if (owner) {
      const params = new URLSearchParams({ owner });
      url += `?${params.toString()}`;
    }

    return this.request<MonthlyStats>(url);
  }

  async getBudgetProgress(
    year: number,
    owner?: string,
  ): Promise<BudgetProgress> {
    try {
      console.log(
        "[API] Fetching budget progress for year:",
        year,
        "owner:",
        owner,
      );
      const queryParams = new URLSearchParams({ year: year.toString() });
      if (owner && owner !== "all") {
        queryParams.append("owner", owner);
      }
      const url = `/api/budget/progress?${queryParams.toString()}`;
      const data = await this.request<BudgetProgress>(url);
      console.log("[API] Budget progress data:", data);
      return data;
    } catch (error) {
      console.error("[API] Error in getBudgetProgress:", error);
      throw error;
    }
  }

  // ========== Category ==========
  async getCategoryMap(): Promise<Record<string, string[]>> {
    return this.request<Record<string, string[]>>("/api/category-map");
  }

  async updateCategoryMap(
    updates: CategoryUpdate,
  ): Promise<Record<string, string[]>> {
    return this.request<Record<string, string[]>, CategoryUpdate>(
      "/api/category-map",
      {
        method: "POST",
        data: updates,
      },
    );
  }

  // ========== Financials ==========
  async getMonthlyFinancials(): Promise<MonthlyFinancials[]> {
    const response = await this.request<{
      success: boolean;
      data: MonthlyFinancials[];
    }>("/api/financials/monthly");
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    console.error(
      "Invalid response format from getMonthlyFinancials:",
      response,
    );
    return [];
  }

  // ========== Income ==========
  async getLatestIncome(): Promise<{ amount: number; date: string }> {
    return this.request<{ amount: number; date: string }>("/api/income/latest");
  }

  // ========== Stats ==========
  async getYearlyStats(year: number, owner?: string): Promise<YearlyStats> {
    const queryParams = new URLSearchParams();
    if (owner && owner !== "all") {
      queryParams.append("owner", owner);
    }
    const queryString = queryParams.toString();
    const url = `/api/stats/yearly/${year}${queryString ? `?${queryString}` : ""}`;
    return this.request<YearlyStats>(url);
  }

  async getCategoryStats(
    year: number,
    owner?: string,
    filterUnexpected?: boolean,
  ): Promise<CategoryYearlyStats> {
    const searchParams = new URLSearchParams();
    if (owner && owner !== "all") {
      searchParams.append("owner", owner);
    }
    if (filterUnexpected) {
      searchParams.append("filterUnexpected", "true");
    }
    const url =
      `/api/stats/category/${year}` +
      (searchParams.toString() ? `?${searchParams.toString()}` : "");
    return this.request<CategoryYearlyStats>(url);
  }

  // ========== Summary ==========
  async getSummary(): Promise<Summary> {
    return this.request<Summary>("/api/summary");
  }

  // ========== Transaction ==========
  async createTransaction(transaction: Omit<Transaction, "id">): Promise<void> {
    return this.request<void, Omit<Transaction, "id">>("/api/transaction", {
      method: "POST",
      data: transaction,
    });
  }

  // ========== Upload ==========
  async uploadFile(formData: FormData): Promise<UploadResponse> {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || "File upload failed");
    }

    return response.json() as Promise<UploadResponse>;
  }

  // ========== Upload Preview ==========
  async uploadFilePreview(formData: FormData): Promise<PreviewUploadResponse> {
    const response = await fetch("/api/upload/preview", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || "File upload preview failed");
    }

    return response.json() as Promise<PreviewUploadResponse>;
  }

  // ========== Upload Save ==========
  async uploadFileSave(data: {
    transactions: TransactionPreview[];
    platform: string;
    owner: string;
  }): Promise<UploadResponse> {
    const response = await fetch("/api/upload/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || "File save failed");
    }

    return response.json() as Promise<UploadResponse>;
  }

  // ========== Years ==========
  async getYears(): Promise<number[]> {
    const result = await this.request<YearsResponse>("/api/years");
    return result.years;
  }

  async getMonthsInYear(year: number, owner?: string): Promise<number[]> {
    const queryParams = new URLSearchParams();
    if (owner && owner !== "all") {
      queryParams.append("owner", owner);
    }
    const queryString = queryParams.toString();
    const url = `/api/years/${year}/months${queryString ? `?${queryString}` : ""}`;
    const result = await this.request<MonthsResponse>(url);
    return result.months;
  }

  // ========== insights ==========
  async getInsights(year: number, owner?: string): Promise<InsightsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("year", year.toString());
    if (owner && owner !== "all") {
      queryParams.append("owner", owner);
    }
    const queryString = queryParams.toString();
    const url = `/api/insights?${queryString}`;
    const result = await this.request<InsightsResponse>(url);
    return result;
  }
}

export const apiClient = new ApiClient();
