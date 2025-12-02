class BundleManager {
  constructor(config) {
    this.config = config;

    this.selectedItems = new Array(config.maxItems).fill(null);

    this.preselectedVariantIds = config.preselectedVariantIds || [];

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
      closeBtn: document.querySelector('#biscuits-bundle-close'),
    };

    document.addEventListener('BiscuitsBundleForm:ready', (e) => {
      console.log(e);
      this.preselectedVariantIds = e?.srcElement?.bundleRules?.steps[0]?.preselected_variants || [];
      this.init();
    });
  }

  init() {
    this.fillPreselectedItems();
    this.initListeners();
    this.render();
  }

  fillPreselectedItems() {
    if (!this.preselectedVariantIds.length) {
      return;
    }

    console.log('No preselected variants found', document.querySelector('#biscuits-step--1'));
    document.querySelector('#biscuits-step--1').style.display = 'none';

    this.preselectedVariantIds.forEach((id, index) => {
      const productElement = event.target;
      const imgTag = productElement.querySelector('.biscuits-bundle-item__container .biscuits-bundle-item__image img');
      const jsonEl = productElement.querySelector(`[data-biscuits-selected-variant-id="${id}"] .biscuits-bundle-item__json`);
      const data = JSON.parse(jsonEl.textContent.trim());

      if (index < this.config.maxItems) {
        this.selectedItems[index] = {
          title: data.product_title,
          variantId: id,
          image: imgTag ? imgTag.src : '',
          price: data.price,
          quantity: data.min,
          isLocked: true,
        };
      }
    });

    this.advanceToNextEmptySlot();
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
        const item = this.selectedItems[index];
        if (item && item.isLocked) {
          console.log('This slot is mandatory and cannot be changed.');
          return;
        }

        this.activeSlotIndex = index;
        this.render();
      });
    });
  }

  handleProductSelection(event) {
    if (this.isProcessing) {
      return;
    }

    const { product_title: title, variant_id: variantId, variant_title: variantTitle, quantity } = event.detail;

    if (this.preselectedVariantIds.includes(`${variantId}`)) {
      return;
    }

    const existingSlotIndex = this.selectedItems.findIndex((item) => item && item.variantId === variantId);

    if (existingSlotIndex !== -1) {
      if (this.selectedItems[existingSlotIndex].isLocked) {
        return;
      }
    }

    this.isProcessing = true;
    if (existingSlotIndex !== -1) {
      this.selectedItems[existingSlotIndex] = null;
      this.activeSlotIndex = existingSlotIndex;
    } else {
      const currentItem = this.selectedItems[this.activeSlotIndex];
      if (currentItem && currentItem.isLocked) {
        this.isProcessing = false;
        return;
      }

      const productElement = event.target;
      const imgTag = productElement.querySelector('.biscuits-bundle-item__container .biscuits-bundle-item__image img');

      const newItem = {
        title: `${title} ${variantTitle}`.replace('Default Title', ''),
        variantId,
        image: imgTag ? imgTag.src : '',
        price: event.detail.price || 0,
        quantity: quantity || 1,
        isLocked: false,
      };

      this.selectedItems[this.activeSlotIndex] = newItem;
      this.advanceToNextEmptySlot();
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

      card.classList.remove('active', 'locked');

      if (index === this.activeSlotIndex) {
        card.classList.add('active');
      }

      if (item) {
        if (item.isLocked) {
          card.classList.add('locked');
        }

        card.innerHTML = `
          <div class="bundle-trigger-card__image-wrapper">
            <img src="${item.image}" alt="${item.title}">
            ${item.quantity > 1 ? `<div class="bundle-trigger-card-quantity">${item.quantity}</div>` : ''}
            ${item.isLocked ? `<div class="bundle-lock-icon">🔒</div>` : ''} 
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

    const addedItemsCount = this.selectedItems.filter((i) => i).length === this.config.maxItems;

    if (this.dom.addToCartButton) {
      this.dom.addToCartButton.classList.toggle('disabled', !addedItemsCount);
      this.dom.productForm.classList.toggle('disabled', !addedItemsCount);
    }

    if (this.dom.priceWrapper) {
      this.dom.priceWrapper.classList.toggle('is-visible', addedItemsCount);
    }

    if (this.dom.closeBtn) {
      this.dom.closeBtn.classList.toggle('is-visible', addedItemsCount);
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

    const preselectedAttr = productInfo.getAttribute('data-preselected-variants');
    let preselectedVariantIds = [];
    if (preselectedAttr) {
      try {
        preselectedVariantIds = JSON.parse(preselectedAttr);
      } catch (e) {
        console.error('Error parsing preselected variants:', e);
      }
    }

    new BundleManager({
      maxItems: maxProductsInBundle,
      preselectedVariantIds: preselectedVariantIds,
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBundleManager);
} else {
  initializeBundleManager();
}
