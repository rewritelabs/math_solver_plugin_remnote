import { renderWidget, useLocalStorageState, usePlugin } from '@remnote/plugin-sdk';

import '../App.css';
import { useEffect, useState } from 'react';
import { SHOP_PRICE_ID, SHOP_URL } from '../constants';
import { checkPaymentSession } from '../helpers/purchase';

export const MathSolverUpgradeWidget = () => {
  const plugin = usePlugin();

  const [shopSessionId, setShopSessionId] = useLocalStorageState<string | undefined>(
    'shopSessionId',
    undefined
  );
  const [shopSessionTimestamp, setShopSessionTimestamp] = useLocalStorageState<number | undefined>(
    'shopSessionTimestamp',
    undefined
  );
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('Payment/Restore process ongoing.');

  const closePopup = async (e: any) => {
    e.preventDefault();
    await plugin.widget.closePopup();
  };

  const buyNow = async (e: any) => {
    e.preventDefault();
    const newShopSessionId = Math.random().toString(36).substring(2, 18);
    setShopSessionId(newShopSessionId);

    await goToCheckout(newShopSessionId);
  };

  const goToCheckout = async (shopSessionIdInput: string) => {
    setShopSessionTimestamp(Date.now());

    // Build the checkout URL:
    const returnUrl = 'https://www.remnote.com/';
    const checkoutUrl = `${SHOP_URL}?op=START&shop_session_id=${shopSessionIdInput}&redirect_url=${encodeURIComponent(
      returnUrl
    )}&line_items[0][price]=${SHOP_PRICE_ID}`;

    // Open checkout in new tab
    window.open(checkoutUrl, '_blank');
  };

  const checkPayment = async (e: any) => {
    e.preventDefault();
    setPaymentStatusMsg('Checking Payment Status.');
    const success = await checkPaymentSession(plugin);
    if (success) {
      await plugin.widget.closePopup();
    }
    setPaymentStatusMsg('Please continue Payment/Restore process.');
  };

  useEffect(() => {
    if (shopSessionId) {
      const handleFocus = async () => {
        if (shopSessionId) {
          setPaymentStatusMsg('Checking Payment Status.');
          const success = await checkPaymentSession(plugin);
          if (success) {
            await plugin.widget.closePopup();
          }
          setPaymentStatusMsg('Payment/Restore process ongoing.');
        }
      };

      window.addEventListener('focus', handleFocus);
      // Run once when popup firt opened
      handleFocus();

      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [shopSessionId]);

  return (
    <div className="mathsolver-plugin__upgrade">
      <h1>Trial has ended</h1>

      {shopSessionId && (
        <div className="mathsolver-plugin__upgrade__status">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
          <p>{paymentStatusMsg}</p>
          <div className="mathsolver-plugin__upgrade__actions">
            <button
              className="mathsolver-plugin__upgrade__btn mathsolver-plugin__upgrade__btn--secondary"
              onClick={checkPayment}
            >
              🔄 Check Status
            </button>
            <button
              className="mathsolver-plugin__upgrade__btn mathsolver-plugin__upgrade__btn--primary"
              onClick={(e) => {
                e.preventDefault();
                goToCheckout(shopSessionId);
              }}
            >
              Continue Checkout
            </button>
          </div>
        </div>
      )}

      <p>
        Continue using math solver plugin for a one-time fee of <strong>18€</strong>
      </p>

      <div className="mathsolver-plugin__upgrade__actions">
        {!shopSessionId && (
          <button
            className="mathsolver-plugin__upgrade__btn mathsolver-plugin__upgrade__btn--primary"
            onClick={buyNow}
          >
            Buy Now or Restore Purchase
          </button>
        )}
        <button
          className="mathsolver-plugin__upgrade__btn mathsolver-plugin__upgrade__btn--secondary"
          onClick={closePopup}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

renderWidget(MathSolverUpgradeWidget);
