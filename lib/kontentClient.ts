import { createDeliveryClient } from "@kontent-ai/delivery-sdk";
import { CoreClientTypes } from "./models/system/core.type";
import { NavigationItemRoot, isNavigationItemRoot } from "./models/content-types/web_spotlight_root";
import { Company_band, isCompany_band } from "./models/content-types/index"; 
import { IContentItem } from "@kontent-ai/delivery-sdk";
import * as contentTypes from './models/content-types/index';
import { Company_venue, isCompany_venue } from "./models/content-types/venue";

// Access the environment variable using process.env
const environmentId = process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID;
const previewApiKey = process.env.KONTENT_PREVIEW_API_KEY;

if (!environmentId) {
  throw new Error("NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID environment variable is not set.");
}

// Initializes the Delivery client with `CoreClientTypes` type for type safety
const deliveryClient = createDeliveryClient<CoreClientTypes>({
  environmentId,
});

// Export the delivery client for reuse
export { deliveryClient };

const sourceTrackingHeaderName = 'X-KC-SOURCE';
const deliveryApiDomain = 'https://deliver.kontent.ai';
const deliveryPreviewApiDomain = 'https://preview-deliver.kontent.ai';
const defaultEnvId = 'default';

const getDeliveryClient = ({ envId, previewApiKey }: ClientConfig) => createDeliveryClient({
  environmentId: envId,
  
  globalHeaders: () => [
    {
      header: sourceTrackingHeaderName,
      value: `${process.env.APP_NAME || "n/a"};${process.env.APP_VERSION || "n/a"}`,
    }
  ],
  proxy: {
    baseUrl: deliveryApiDomain,
    basePreviewUrl: deliveryPreviewApiDomain,
  },
  previewApiKey: defaultEnvId === envId ? process.env.KONTENT_PREVIEW_API_KEY : previewApiKey
  
});

type ClientConfig = {
  envId: string,
  previewApiKey?: string
}


export const ClientConfig = {
  envId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID || '',
  previewApiKey: process.env.KONTENT_PREVIEW_API_KEY || '',
};


/**
 * Logs an error message with additional context.
 * @param operation - The name of the operation where the error occurred.
 * @param error - The error object to log.
 */
function logError(operation: string, error: unknown): void {
  console.error(`Error during ${operation}:`, error);
}

/**
 * Fetches the homepage item from Kontent.ai.
 * @returns The homepage item if found, or null if not found or an error occurs.
 */
export async function fetchHomepageItem(): Promise<NavigationItemRoot | null> {
  try {
    const response = await deliveryClient.item<NavigationItemRoot>("web_spotlight_root").toPromise();
    const homepageItem = response.data.item;

    if (isNavigationItemRoot(homepageItem)) {
      console.log("Homepage Title:", homepageItem.elements.title.value);
      return homepageItem;
    } else {
      console.error("Item is not of type NavigationItemRoot");
      return null;
    }
  } catch (error) {
    logError("fetchHomepageItem", error);
    return null;
  }
}

/**
 * Fetches a generic item by codename from Kontent.ai.
 * @template T - The expected type of the content item.
 * @param codename - The codename of the item to fetch.
 * @returns The fetched item if found, or null if not found or an error occurs.
 */
export async function fetchItemByCodename<T extends IContentItem>(codename: string): Promise<T | null> {
  try {
    const response = await deliveryClient.item<T>(codename).toPromise();
    const item = response.data.item;

    if (!response.data.item) {
      logError("fetchItemByCodename", new Error("No item found in response"));
      return null;
    }

    console.log("Fetched Item:", item);
    return item;
  } catch (error) {
    logError(`fetchItemByCodename (${codename})`, error);
    return null;
  }
}


interface FetchBandsResponse {
  data: {
    items: Company_band[];
  };
}

export const fetchBands = (
  config: ClientConfig,
  slug: string,
  usePreview: boolean
): Promise<Company_band[]> =>
  getDeliveryClient(config)
    .items<IContentItem>()
    .equalsFilter('elements.slug', slug)
    .depthParameter(5) // Ensure sufficient depth
    .queryConfig({
      usePreviewMode: usePreview,
      waitForLoadingNewContent: true,
    })
    .toAllPromise()
    .then((res) => {
      console.log("Full API Response:", JSON.stringify(res.data.items, null, 2)); // Log the full response
      return res.data.items.filter(isCompany_band); // Ensure only valid Company_band items are returned
    })
    .catch((error) => {
      console.error("Error fetching bands:", error);
      return [];
    });


/**
 * Fetches all content items of type 'navigation_item' from Kontent.ai.
 * @returns An array of navigation items or an empty array if none are found.
 */
export async function fetchNavigationItems(): Promise<IContentItem[]> {
  try {
    const response = await deliveryClient.items<IContentItem>().type('navigation_item').toPromise();
    return response.data.items;
  } catch (error) {
    logError("fetchNavigationItems", error);
    return [];
  }
}

/**
 * Fetches all content items of type 'venue' from Kontent.ai.
 * @returns An array of venue content items or an empty array if none are found.
 */
export const fetchVenues = (
  config: ClientConfig,
  slug: string,
  usePreview: boolean
): Promise<Company_venue[]> => {
  console.log("Fetching venues with slug:", slug);

  return getDeliveryClient(config)
    .items<IContentItem>()
    .type("venue")
    .equalsFilter("elements.venue_slug", slug) // Use the correct codename for the slug field
    .depthParameter(5)
    .queryConfig({
      usePreviewMode: usePreview,
      waitForLoadingNewContent: true,
    })
    .toAllPromise()
    .then((res) => {
      console.log("Full API Response:", JSON.stringify(res.data.items, null, 2)); // Log the full response
      return res.data.items.filter(isCompany_venue); // Ensure only valid Company_venue items are returned
    })
    .catch((error) => {
      console.error("Error fetching venues:", error);
      return [];
    });
};