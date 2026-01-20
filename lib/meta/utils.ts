import crypto from "crypto";
import type { MetaUserData, MetaServerEvent, MetaActionSource, MetaEventName } from "./types";

export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export function hashEmail(email: string): string {
  return hashValue(email);
}

export function hashPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return hashValue(cleaned);
}

export function hashName(name: string): string {
  return hashValue(name.toLowerCase().replace(/[^a-z]/g, ""));
}

export function formatDateOfBirth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function hashDateOfBirth(date: Date | string): string {
  return hashValue(formatDateOfBirth(date));
}

export function hashCity(city: string): string {
  return hashValue(city.toLowerCase().replace(/[^a-z]/g, ""));
}

export function hashState(state: string): string {
  return hashValue(state.toLowerCase().replace(/[^a-z]/g, ""));
}

export function hashZipCode(zip: string): string {
  return hashValue(zip.replace(/\s/g, "").toLowerCase());
}

export function hashCountry(country: string): string {
  return hashValue(country.toLowerCase());
}

export function hashGender(gender: "male" | "female" | "m" | "f"): string {
  const normalized = gender.toLowerCase().startsWith("m") ? "m" : "f";
  return hashValue(normalized);
}

export function hashExternalId(id: string): string {
  return hashValue(id);
}

export interface UserDataInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: "male" | "female" | "m" | "f";
  dateOfBirth?: Date | string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

export function buildUserData(input: UserDataInput): MetaUserData {
  const userData: MetaUserData = {};

  if (input.email) {
    userData.em = [hashEmail(input.email)];
  }

  if (input.phone) {
    userData.ph = [hashPhone(input.phone)];
  }

  if (input.firstName) {
    userData.fn = [hashName(input.firstName)];
  }

  if (input.lastName) {
    userData.ln = [hashName(input.lastName)];
  }

  if (input.gender) {
    userData.ge = [hashGender(input.gender)];
  }

  if (input.dateOfBirth) {
    userData.db = [hashDateOfBirth(input.dateOfBirth)];
  }

  if (input.city) {
    userData.ct = [hashCity(input.city)];
  }

  if (input.state) {
    userData.st = [hashState(input.state)];
  }

  if (input.zipCode) {
    userData.zp = [hashZipCode(input.zipCode)];
  }

  if (input.country) {
    userData.country = [hashCountry(input.country)];
  }

  if (input.externalId) {
    userData.external_id = [hashExternalId(input.externalId)];
  }

  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress;
  }

  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent;
  }

  if (input.fbc) {
    userData.fbc = input.fbc;
  }

  if (input.fbp) {
    userData.fbp = input.fbp;
  }

  return userData;
}

export interface EventInput {
  eventName: MetaEventName | string;
  actionSource: MetaActionSource;
  userData: UserDataInput;
  eventSourceUrl?: string;
  eventId?: string;
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contentType?: string;
    numItems?: number;
    searchString?: string;
    status?: string;
    orderId?: string;
  };
  eventTime?: number;
}

export function buildServerEvent(input: EventInput): MetaServerEvent {
  const event: MetaServerEvent = {
    event_name: input.eventName,
    event_time: input.eventTime || Math.floor(Date.now() / 1000),
    action_source: input.actionSource,
    user_data: buildUserData(input.userData),
  };

  if (input.eventSourceUrl) {
    event.event_source_url = input.eventSourceUrl;
  }

  if (input.eventId) {
    event.event_id = input.eventId;
  }

  if (input.customData) {
    event.custom_data = {};

    if (input.customData.value !== undefined) {
      event.custom_data.value = input.customData.value;
    }

    if (input.customData.currency) {
      event.custom_data.currency = input.customData.currency;
    }

    if (input.customData.contentName) {
      event.custom_data.content_name = input.customData.contentName;
    }

    if (input.customData.contentCategory) {
      event.custom_data.content_category = input.customData.contentCategory;
    }

    if (input.customData.contentIds) {
      event.custom_data.content_ids = input.customData.contentIds;
    }

    if (input.customData.contentType) {
      event.custom_data.content_type = input.customData.contentType;
    }

    if (input.customData.numItems !== undefined) {
      event.custom_data.num_items = input.customData.numItems;
    }

    if (input.customData.searchString) {
      event.custom_data.search_string = input.customData.searchString;
    }

    if (input.customData.status) {
      event.custom_data.status = input.customData.status;
    }

    if (input.customData.orderId) {
      event.custom_data.order_id = input.customData.orderId;
    }
  }

  return event;
}

export function generateEventId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

export function extractFbClickId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("fbclid");
  } catch {
    return null;
  }
}

export function buildFbc(fbclid: string, domain?: string): string {
  const version = "fb";
  const subdomainIndex = domain ? "1" : "0";
  const creationTime = Date.now();
  return `${version}.${subdomainIndex}.${creationTime}.${fbclid}`;
}
