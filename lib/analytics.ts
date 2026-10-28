/**
 * SaffronVastra First-Party Activity & Analytics SDK
 * Captures route transitions, product views, cart interactions, and active foreground heartbeats.
 */

export interface TrackEventPayload {
  eventId?: string;
  eventName: string;
  occurredAt?: string;
  routeTemplate?: string;
  path: string;
  productId?: string | null;
  metadata?: Record<string, any>;
}

const STORAGE_KEY_GUEST_ID = "saffron_guest_id";
const STORAGE_KEY_SESSION_ID = "saffron_tracking_session_id";
const BATCH_FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 10;
const HEARTBEAT_INTERVAL_MS = 15000;

class AnalyticsSDK {
  private queue: TrackEventPayload[] = [];
  private flushTimer: any = null;
  private heartbeatTimer: any = null;
  private lastHeartbeatTime: number = Date.now();
  private isInitialized = false;
  private guestId: string | null = null;
  private trackingSessionId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private generateUUID(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public init() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    // Load persisted IDs from localStorage or cookies
    this.guestId = localStorage.getItem(STORAGE_KEY_GUEST_ID) || this.getCookie(STORAGE_KEY_GUEST_ID);
    this.trackingSessionId =
      localStorage.getItem(STORAGE_KEY_SESSION_ID) || this.getCookie(STORAGE_KEY_SESSION_ID);

    // Bootstrap or verify tracking session with API
    this.ensureSession();

    // Start batch flush timer
    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, BATCH_FLUSH_INTERVAL_MS);

    // Start active foreground heartbeat timer
    this.lastHeartbeatTime = Date.now();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Flush events on window unload or visibility change
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.sendHeartbeat();
        this.flushQueue(true); // useBeacon if available
      } else {
        this.lastHeartbeatTime = Date.now();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.sendHeartbeat();
      this.flushQueue(true);
    });
  }

  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, days = 365) {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  public async ensureSession(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    if (this.trackingSessionId) {
      return this.trackingSessionId;
    }

    try {
      const headers: Record<string, string> = {};
      if (this.guestId) headers["x-guest-id"] = this.guestId;

      const res = await fetch("/api/v1/analytics/session", {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const body = await res.json();
        if (body.data?.trackingSessionId) {
          const sid = String(body.data.trackingSessionId);
          this.trackingSessionId = sid;
          localStorage.setItem(STORAGE_KEY_SESSION_ID, sid);
          this.setCookie(STORAGE_KEY_SESSION_ID, sid);
        }
        if (body.data?.guestProfileId && !this.guestId) {
          const gid = String(body.data.guestProfileId);
          this.guestId = gid;
          localStorage.setItem(STORAGE_KEY_GUEST_ID, gid);
          this.setCookie(STORAGE_KEY_GUEST_ID, gid);
        }
      }
    } catch (e) {
      // Non-blocking
      console.debug("[Analytics] session bootstrap retry deferred");
    }

    return this.trackingSessionId;
  }

  /**
   * Enqueue an analytics event
   */
  public track(
    eventName: string,
    metadata: Record<string, any> = {},
    options: {
      productId?: string | null;
      path?: string;
      routeTemplate?: string;
      immediate?: boolean;
    } = {}
  ) {
    if (typeof window === "undefined") return;

    const currentPath = options.path || window.location.pathname;
    const routeTemplate = options.routeTemplate || currentPath;

    const payload: TrackEventPayload = {
      eventId: this.generateUUID(),
      eventName,
      occurredAt: new Date().toISOString(),
      routeTemplate,
      path: currentPath,
      productId: options.productId || null,
      metadata: {
        ...metadata,
        title: document.title,
        referrer: document.referrer || null,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      },
    };

    this.queue.push(payload);

    if (options.immediate || this.queue.length >= MAX_BATCH_SIZE) {
      this.flushQueue();
    }
  }

  /**
   * Flush queued events to backend API
   */
  public async flushQueue(useBeacon = false) {
    if (this.queue.length === 0) return;

    const eventsToFlush = [...this.queue];
    this.queue = [];

    const payload = {
      trackingSessionId: this.trackingSessionId,
      guestId: this.guestId,
      events: eventsToFlush,
    };

    const endpoint = "/api/v1/analytics/events";
    const bodyStr = JSON.stringify(payload);

    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: "application/json" });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.trackingSessionId ? { "x-tracking-session-id": this.trackingSessionId } : {}),
          ...(this.guestId ? { "x-guest-id": this.guestId } : {}),
        },
        body: bodyStr,
        keepalive: true,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.trackingSessionId && !this.trackingSessionId) {
          const sid = String(data.data.trackingSessionId);
          this.trackingSessionId = sid;
          localStorage.setItem(STORAGE_KEY_SESSION_ID, sid);
          this.setCookie(STORAGE_KEY_SESSION_ID, sid);
        }
      } else {
        // Re-queue events on non-fatal failure
        this.queue = [...eventsToFlush, ...this.queue];
      }
    } catch (e) {
      // Re-queue events on network failure
      this.queue = [...eventsToFlush, ...this.queue];
    }
  }

  /**
   * Record active foreground time heartbeat
   */
  public async sendHeartbeat() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Only record heartbeat if document is active & visible
    if (document.visibilityState !== "visible") return;

    const now = Date.now();
    const elapsedSeconds = Math.round((now - this.lastHeartbeatTime) / 1000);
    this.lastHeartbeatTime = now;

    if (elapsedSeconds < 3) return; // Too short to register

    const payload = {
      trackingSessionId: this.trackingSessionId,
      guestId: this.guestId,
      seconds: Math.min(elapsedSeconds, 60),
      path: window.location.pathname,
    };

    try {
      await fetch("/api/v1/analytics/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.trackingSessionId ? { "x-tracking-session-id": this.trackingSessionId } : {}),
          ...(this.guestId ? { "x-guest-id": this.guestId } : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "include",
      });
    } catch (e) {
      // Ignore heartbeat failures
    }
  }

  // Convenience track methods
  public trackPageView(path: string, routeTemplate?: string, metadata: Record<string, any> = {}) {
    this.track("page_view", metadata, { path, routeTemplate, immediate: true });
  }

  public trackProductView(
    productId: string,
    title?: string,
    slug?: string,
    priceMinor?: number,
    metadata: Record<string, any> = {}
  ) {
    this.track(
      "product_view",
      { title, slug, priceMinor, ...metadata },
      { productId, immediate: true }
    );
  }

  public trackAddToCart(
    productId: string,
    variantId?: string,
    title?: string,
    quantity = 1,
    priceMinor?: number
  ) {
    this.track(
      "add_to_cart",
      { variantId, title, quantity, priceMinor },
      { productId, immediate: true }
    );
  }

  public trackRemoveFromCart(productId: string, variantId?: string, quantity = 1) {
    this.track("remove_from_cart", { variantId, quantity }, { productId, immediate: true });
  }

  public trackCheckoutStep(stepNumber: number, stepName: string, metadata: Record<string, any> = {}) {
    this.track("checkout_step", { stepNumber, stepName, ...metadata }, { immediate: true });
  }

  public trackOrderCompleted(
    orderNumber: string,
    totalMinor: number,
    itemsCount = 1,
    metadata: Record<string, any> = {}
  ) {
    this.track(
      "order_completed",
      { orderNumber, totalMinor, itemsCount, ...metadata },
      { immediate: true }
    );
  }
}

export const analytics = new AnalyticsSDK();
