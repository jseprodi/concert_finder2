import { createDeliveryClient, IResponse } from "@kontent-ai/delivery-sdk";
import { IHttpService, IHttpGetQueryCall, IHttpQueryOptions } from "@kontent-ai/core-sdk";
import { CoreClientTypes } from "./models/system/core.type.js";
import https from "https";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

let httpsAgent: https.Agent | undefined;

if (typeof window === "undefined") {
  const fs = require("fs");
  httpsAgent = new https.Agent({
    cert: fs.readFileSync("certs/cert.pem"),
    key: fs.readFileSync("certs/key.pem"),
  });
}

// Custom implementation of IHttpService
class CustomHttpService implements IHttpService<AxiosRequestConfig> {
  private axiosInstance = axios.create({
    httpsAgent,
  });

  async getAsync<TRawData>(
    call: IHttpGetQueryCall,
    options?: IHttpQueryOptions<AxiosRequestConfig>
  ): Promise<IResponse<TRawData>> {
    const response: AxiosResponse = await this.axiosInstance.get(call.url, options?.config);
    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      rawResponse: response,
      retryStrategy: options?.retryStrategy,
    };
  }

  async postAsync<TRawData>(
    call: { url: string; data?: any; config?: AxiosRequestConfig },
    options?: IHttpQueryOptions<AxiosRequestConfig>
  ): Promise<IResponse<TRawData>> {
    const response: AxiosResponse = await this.axiosInstance.post(call.url, call.data, call.config);
    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      rawResponse: response,
      retryStrategy: options?.retryStrategy,
    };
  }

  async patchAsync<TRawData>(
    call: { url: string; data?: any; config?: AxiosRequestConfig },
    options?: IHttpQueryOptions<AxiosRequestConfig>
  ): Promise<IResponse<TRawData>> {
    const response: AxiosResponse = await this.axiosInstance.patch(call.url, call.data, call.config);
    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      rawResponse: response,
      retryStrategy: options?.retryStrategy,
    };
  }

  async deleteAsync<TRawData>(
    call: { url: string; config?: AxiosRequestConfig },
    options?: IHttpQueryOptions<AxiosRequestConfig>
  ): Promise<IResponse<TRawData>> {
    const response: AxiosResponse = await this.axiosInstance.delete(call.url, call.config);
    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      rawResponse: response,
      retryStrategy: options?.retryStrategy,
    };
  }
}

// Create an instance of the custom HTTP service
const customHttpService = new CustomHttpService();

// Initializes the Delivery client with `CoreClientTypes` type for type safety
const deliveryClient = createDeliveryClient<CoreClientTypes>({
  environmentId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID!,
  httpService: customHttpService,
});

// Export the delivery client for reuse
export { deliveryClient };

