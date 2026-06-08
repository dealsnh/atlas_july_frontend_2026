import type { AxiosRequestConfig } from "axios";
import { resolveRequestUrl } from "@/lib/apiBaseUrl";
import axiosInstance from "./axiosInstance";

type ApiInvokerExtraConfig = Omit<AxiosRequestConfig, "url" | "method" | "data" | "params"> & {
  skipUnauthorizedRedirect?: boolean;
  _retry?: boolean;
};

async function apiInvoker<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  data?: object,
  params?: object,
  config?: ApiInvokerExtraConfig,
): Promise<T> {
  try {
    const response = await axiosInstance({
      ...config,
      url: resolveRequestUrl(url),
      method,
      data,
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`API call to ${url} failed: `, error);
    throw error;
  }
}

export default apiInvoker;
