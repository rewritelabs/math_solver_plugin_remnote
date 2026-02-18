import {
  ANALYTICS_EVENTS,
  ANALYTICS_PROJECT,
  ANALYTICS_STORAGE_MONTH_KEY,
  ANALYTICS_URL,
} from '../constants';

type AnalyticsStorage = {
  getLocal: (key: string) => Promise<unknown>;
  setLocal: (key: string, value: string) => Promise<void>;
};

type AnalyticsPluginLike = {
  storage: AnalyticsStorage;
};

function getCurrentYYYYMM(): string {
  const now = new Date();
  const year = now.getUTCFullYear().toString();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

function isValidYYYYMM(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{6}$/.test(value)) {
    return false;
  }
  const month = Number(value.slice(4, 6));
  return month >= 1 && month <= 12;
}

async function postEvent(event: string): Promise<void> {
  try {
    await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: ANALYTICS_PROJECT,
        event,
      }),
    });
  } catch {
    // Analytics must never block or affect user-facing plugin behavior.
  }
}

export async function trackEditorOpenAnalytics(plugin: AnalyticsPluginLike): Promise<void> {
  const currentMonth = getCurrentYYYYMM();
  const storedMonthRaw = await plugin.storage.getLocal(ANALYTICS_STORAGE_MONTH_KEY);
  const storedMonth = isValidYYYYMM(storedMonthRaw) ? storedMonthRaw : undefined;

  if (!storedMonth) {
    await postEvent(ANALYTICS_EVENTS.install);
    await plugin.storage.setLocal(ANALYTICS_STORAGE_MONTH_KEY, currentMonth);
    return;
  }

  if (storedMonth === currentMonth) {
    return;
  }

  await postEvent(ANALYTICS_EVENTS.monthlyActive);
  await plugin.storage.setLocal(ANALYTICS_STORAGE_MONTH_KEY, currentMonth);
}
