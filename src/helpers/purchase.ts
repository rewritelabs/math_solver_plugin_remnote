import { RNPlugin } from '@remnote/plugin-sdk';
import { daysSince2025 } from './others';
import { SHOP_PRODUCT_ID, SHOP_URL } from '../constants';

export const checkPurchaseStatus = async (plugin: RNPlugin) => {
  const now = daysSince2025();

  const purchaseLastValid = await plugin.storage.getSynced<number | undefined>('purchaseLastValid');
  if (purchaseLastValid && now <= purchaseLastValid + 10) {
    return 'VALID';
  } else {
    const result = await checkAccessToken(plugin);
    if (result) {
      return 'VALID';
    }
  }

  const trialPeriodStart = await plugin.storage.getSynced<number | undefined>('trialPeriodStart');
  if (!trialPeriodStart) {
    await plugin.storage.setSynced('trialPeriodStart', now);
    return 'TRIAL';
  }

  if (now < trialPeriodStart + 30) {
    return 'TRIAL';
  }

  // After trial
  let purchaseStatus = 'GRACEPERIOD';

  const gracePeriodStart = await plugin.storage.getSynced<number | undefined>('gracePeriodStart');
  if (!gracePeriodStart || gracePeriodStart === 0) {
    await plugin.storage.setSynced('gracePeriodStart', now);
    purchaseStatus = 'GRACEPERIOD';
  } else if (now < gracePeriodStart + 30) {
    purchaseStatus = 'GRACEPERIOD';
  } else {
    // grace and trial over
    purchaseStatus = 'INVALID';
  }

  plugin.widget.openPopup('math_solver_upgrade_widget');
  return purchaseStatus;
};

export const checkPaymentSession = async (plugin: RNPlugin) => {
  const shopSessionId = await plugin.storage.getLocal<string | undefined>('shopSessionId');
  const shopSessionTimestamp = await plugin.storage.getLocal<number | undefined>(
    'shopSessionTimestamp'
  );

  if (shopSessionId && shopSessionTimestamp) {
    if (shopSessionTimestamp + 1000 * 60 * 60 < Date.now()) {
      await plugin.storage.setLocal('shopSessionId', undefined);
      await plugin.storage.setLocal('shopSessionTimestamp', undefined);
      return false;
    }
  }
  if (shopSessionId) {
    const response = await fetch(`${SHOP_URL}?op=ACTIVATE&shop_session_id=${shopSessionId}`);

    if (!response.ok) {
      return false;
    }

    const result = await response.json();

    if (result.token) {
      await plugin.storage.setSynced('accessToken', result.token);
      await plugin.storage.setLocal('shopSessionId', undefined);
      await plugin.storage.setLocal('shopSessionTimestamp', undefined);
      const products = result.jwtpayload.products;
      const activated = await activateProducts(plugin, products);
      if (activated) {
        alert('✅ Product Successfully Activated.');
        return true;
      }
    }
  }

  return false;
};

const activateProducts = async (plugin: RNPlugin, products: { [key: string]: number }) => {
  const now = daysSince2025();
  for (const productId of Object.keys(products)) {
    if (productId == SHOP_PRODUCT_ID) {
      await plugin.storage.setSynced('purchaseLastValid', now);
      return true;
    }
  }
  await plugin.storage.setSynced('purchaseLastValid', undefined);
  return false;
};

const checkAccessToken = async (plugin: RNPlugin) => {
  try {
    const accessToken = await plugin.storage.getSynced<string | undefined>('accessToken');

    if (!accessToken) {
      return false;
    }

    const response = await fetch(`${SHOP_URL}?op=JWTCHECK`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Handle expired/invalid token
    if (response.status === 401) {
      // Token is no longer valid
      await plugin.storage.setSynced('accessToken', undefined);
      return false;
    }

    if (!response.ok) {
      // Keep valid if invlaid response
      return true;
    }

    const result = await response.json();

    // Server might send us a refreshed token - store it if provided
    if (result.newToken && result.token) {
      await plugin.storage.setSynced('accessToken', result.token);
    }

    const products = result.jwtpayload.products;
    const activated = await activateProducts(plugin, products);
    if (activated) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    // Keep valid if invlaid response
    return true;
  }
};
