const GIFT_PRODUCT_ID = Number(window.free_gift_product.id);
const GIFT_PRICE = Number(window.free_gift_product.price);
let isGiftManuallyRemoved = false;

async function updateFreeGift(e) {
  const cart = e.detail.cart;
  const items = cart.items;
  const MIN_PRICE_FOR_GIFT = 5000;

  const hasLandingPageItem = items.some((item) => item.properties?._from_landing_pages === 'true');
  const giftInCart = items.find((item) => item.id === GIFT_PRODUCT_ID && item.properties?._gift_product === 'true');

  const nonGiftItems = items.filter((item) => !(item.id === GIFT_PRODUCT_ID && item.properties?._gift_product === 'true'));
  const hasOtherItems = nonGiftItems.length > 0;

  let priceWithoutGift = nonGiftItems.reduce((sum, item) => {
    if (item.properties?._from_landing_pages === 'true') {
      return sum + item.price * item.quantity;
    }
    return sum;
  }, 0);

  const shouldHaveGift = hasLandingPageItem && priceWithoutGift >= MIN_PRICE_FOR_GIFT && hasOtherItems;

  if (shouldHaveGift && !giftInCart && !isGiftManuallyRemoved) {
    try {
      const payload = {
        items: [
          {
            id: GIFT_PRODUCT_ID,
            quantity: 1,
            properties: {
              _gift_product: 'true',
            },
          },
        ],
      };

      const addRes = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!addRes.ok) throw new Error(`Failed to add gift: ${addRes.status}`);

      const addedGift = await addRes.json();
      // console.log('Free gift added:', addedGift);
      isGiftManuallyRemoved = false;
    } catch (err) {
      console.error('Error adding free gift:', err);
    }
  } else if (!shouldHaveGift && giftInCart) {
    try {
      const payload = {
        updates: {
          [giftInCart.key]: 0,
        },
      };

      const updateRes = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!updateRes.ok) throw new Error(`Failed to remove gift: ${updateRes.status}`);

      const updatedCart = await updateRes.json();
      isGiftManuallyRemoved = false;
    } catch (err) {
      console.error('Error removing free gift:', err);
    }
  }
}

window.addEventListener('kaching-cart:item-added', (e) => {
  isGiftManuallyRemoved = false;
  updateFreeGift(e);
});

window.addEventListener('kaching-cart:item-removed', (e) => {
  if (e.detail.item.id === GIFT_PRODUCT_ID && e.detail.item.properties?._gift_product === 'true') {
    isGiftManuallyRemoved = true;
    return;
  }
  isGiftManuallyRemoved = false;
  updateFreeGift(e);
});

window.addEventListener('kaching-cart:cart-updated', (e) => {
  updateFreeGift(e);
});
