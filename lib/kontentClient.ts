import { createDeliveryClient } from "@kontent-ai/delivery-sdk";
import { CoreClientTypes } from "./models/system/core.type.js";
import { NavigationItemRoot, isNavigationItemRoot } from "./models/content-types/web_spotlight_root";
import { Band } from "./models/content-types/band"; 
import { IContentItem } from "@kontent-ai/delivery-sdk";
c1ad4901-f748-000b-2b83-2c4fa51e2983
const environmentId = NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID;
if (!environmentId) {
  throw new Error("NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID environment variable is not set.");
}

// Initializes the Delivery client with `CoreClientTypes` type for type safety
const deliveryClient = createDeliveryClient<CoreClientTypes>({
  environmentId,
});

// Utility function for error logging
function logError(operation: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error during ${operation}: ${error.message}`, error.stack);
  } else {
    console.error(`Unknown error during ${operation}:`, error);
  }
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

/**
 * Fetches all content items of type 'band' from Kontent.ai.
 * @returns An array of band content items or an empty array if none are found.
 */
export async function fetchBands(): Promise<Band[]> {
  try {
    const response = await deliveryClient.items<Band>().type('band').toPromise();
    return response.data.items;
  } catch (error) {
    logError('fetchBands', error);
    return [];
  }
}

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
export async function fetchVenues(): Promise<IContentItem[]> {
  try {
    const response = await deliveryClient.items<IContentItem>().type('venue').toPromise();
    return response.data.items;
  } catch (error) {
    logError("fetchVenues", error);
    return [];
  }
}

// Export the delivery client for reuse
export { deliveryClient };

