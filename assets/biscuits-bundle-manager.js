class BundleManager {
  constructor(config) {
    this.config = config;

    this.selectedItems = new Array(config.maxItems).fill(null);

    this.activeSlotIndex = 0;
    this.isProcessing = false;

    this.dom = {
      cards: document.querySelectorAll('.bundle-trigger-card'),
      priceWrapper: document.querySelector('.bundle-builder-price-wrapper'),
      totalPrice: document.querySelector('#bundle-total-price'),
      discountedPrice: document.querySelector('#bundle-discounted-price'),
      savingsMoney: document.querySelector('#bundle-savings'),
      addToCartButton: document.querySelector('.product-form__submit'),
      productForm: document.querySelector('product-form.product-form'),
    };

    document.addEventListener('BiscuitsBundleForm:ready', (e) => {
      this.init();
    });
  }

  init() {
    this.initListeners();
    this.render();
  }

  initListeners() {
    document.querySelectorAll('.biscuits-bundle-step').forEach((step) => {
      step.addEventListener('biscuits--step-update', (e) => this.handlePriceUpdate(e));
    });

    document.querySelectorAll('.biscuits-bundle-item').forEach((item) => {
      item.addEventListener('biscuits--product-selection', (e) => this.handleProductSelection(e));
    });

    this.dom.cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        this.activeSlotIndex = index;
        this.render();
      });
    });
  }

  handleProductSelection(event) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    const { product_title: title, variant_id: variantId, variant_title: variantTitle, quantity } = event.detail;
    const existingSlotIndex = this.selectedItems.findIndex((item) => item && item.variantId === variantId);

    console.log('event.detail', event.detail);

    if (existingSlotIndex !== -1) {
      this.selectedItems[existingSlotIndex] = null;
    } else {
      if (this.selectedItems[this.activeSlotIndex] === null) {
        const productElement = event.target;
        const imgTag = productElement.querySelector('.biscuits-bundle-item__container .biscuits-bundle-item__image img');

        const newItem = {
          title: `${title} ${variantTitle}`.replace('Default Title', ''),
          variantId,
          image: imgTag ? imgTag.src : '',
          price: event.detail.price || 0,
          quantity: quantity || 1,
        };

        this.selectedItems[this.activeSlotIndex] = newItem;
        this.advanceToNextEmptySlot();
      }
    }

    this.render();

    setTimeout(() => {
      this.isProcessing = false;
    }, 100);
  }

  advanceToNextEmptySlot() {
    const nextEmptyIndex = this.selectedItems.findIndex((item) => item === null);
    if (nextEmptyIndex !== -1) {
      this.activeSlotIndex = nextEmptyIndex;
    }
  }

  handlePriceUpdate() {
    const form = document.querySelector('biscuits-bundle-form');
    if (!form) return;

    const { formCompareAtPrice, formTotalPrice, moneyFormat } = form;
    const savings = formCompareAtPrice - formTotalPrice;
    const format = moneyFormat || '${{amount}}';

    if (this.dom.totalPrice) {
      this.dom.totalPrice.textContent = this.formatMoney(formCompareAtPrice, format);
    }
    if (this.dom.discountedPrice) {
      this.dom.discountedPrice.textContent = this.formatMoney(formTotalPrice, format);
    }
    if (this.dom.savingsMoney) {
      this.dom.savingsMoney.textContent = this.formatMoney(savings, format);
    }
  }

  render() {
    this.dom.cards.forEach((card, index) => {
      const item = this.selectedItems[index];

      if (item) {
        card.innerHTML = `
          <div class="bundle-trigger-card__image-wrapper">
            <img src="${item.image}" alt="${item.title}">
            ${item.quantity > 1 ? `<div class="bundle-trigger-card-quantity">${item.quantity}</div>` : ''}
          </div>
          <div class="bundle-trigger-card-title">${item.title}</div>
        `;
        card.classList.remove('empty');
        card.classList.add('filled');
      } else {
        card.innerHTML = '';
        card.classList.add('empty');
        card.classList.remove('filled');
      }
    });

    if (this.dom.addToCartButton) {
      const hasItems = this.selectedItems.filter((i) => i).length === this.config.maxItems;
      this.dom.addToCartButton.classList.toggle('disabled', !hasItems);
      this.dom.productForm.classList.toggle('disabled', !hasItems);
    }

    if (this.dom.priceWrapper) {
      const hasItems = this.selectedItems.filter((i) => i).length > 0;
      this.dom.priceWrapper.classList.toggle('is-visible', hasItems);
    }
  }

  formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    let value = '';
    let placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    let formatString = format || '${{amount}}';

    const formatWithDelimiters = (number, precision = 2, thousands = ',', decimal = '.') => {
      if (isNaN(number) || number == null) return 0;

      number = (Math.round(number) / 100.0).toFixed(precision);
      const parts = number.split('.');
      const dollars = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands);
      const centsPart = parts[1] ? decimal + parts[1] : '';

      return dollars + centsPart;
    };

    const match = formatString.match(placeholderRegex);
    if (!match) return formatString;

    switch (match[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }

    return formatString.replace(placeholderRegex, value);
  }
}

function initializeBundleManager() {
  const productInfo = document.querySelector('product-info[data-max-products-in-bundle]');
  if (productInfo) {
    const maxProductsInBundleAttr = productInfo.getAttribute('data-max-products-in-bundle');
    const maxProductsInBundle = parseInt(maxProductsInBundleAttr, 10) || 3;
    new BundleManager({ maxItems: maxProductsInBundle });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBundleManager);
} else {
  initializeBundleManager();
}
