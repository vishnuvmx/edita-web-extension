(function initToolsFooter() {
  if (!document.body) {
    return;
  }

  const dropdownState = new WeakMap();
  const enhancedSelects = new Set();

  function getSelectValueText(select) {
    const option = select.options[select.selectedIndex];
    if (option && option.textContent) {
      return option.textContent.trim();
    }

    return select.dataset.placeholder || 'Select an option';
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.base-select-wrap[data-open="true"]').forEach((wrapper) => {
      wrapper.dataset.open = 'false';
      const trigger = wrapper.querySelector('.base-select-trigger');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function syncDropdownUI(select) {
    const wrapper = select.closest('.base-select-wrap');
    if (!wrapper) {
      return;
    }

    const valueEl = wrapper.querySelector('.base-select-value');
    const options = wrapper.querySelectorAll('.base-select-option');

    if (valueEl) {
      valueEl.textContent = getSelectValueText(select);
    }

    options.forEach((option) => {
      const isSelected = option.dataset.value === select.value;
      option.dataset.selected = isSelected ? 'true' : 'false';
      option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function renderDropdownOptions(select) {
    const wrapper = select.closest('.base-select-wrap');
    if (!wrapper) {
      return;
    }

    const menu = wrapper.querySelector('.base-select-menu');
    if (!menu) {
      return;
    }

    menu.textContent = '';

    Array.from(select.options).forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'base-select-option';
      button.setAttribute('role', 'option');
      button.dataset.value = option.value;
      button.textContent = option.textContent;

      if (option.disabled) {
        button.disabled = true;
      }

      if (index === 0 && !select.value) {
        button.dataset.selected = 'true';
      }

      button.addEventListener('click', () => {
        if (button.disabled || select.value === option.value) {
          closeAllDropdowns();
          return;
        }

        select.value = option.value;
        syncDropdownUI(select);
        closeAllDropdowns();
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });

      menu.appendChild(button);
    });

    syncDropdownUI(select);
  }

  function openDropdown(wrapper) {
    closeAllDropdowns();
    wrapper.dataset.open = 'true';
    const trigger = wrapper.querySelector('.base-select-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  function initDropdownBehavior(select) {
    const wrapper = select.closest('.base-select-wrap');
    if (!wrapper) {
      return;
    }

    const trigger = wrapper.querySelector('.base-select-trigger');
    if (!trigger || dropdownState.has(wrapper)) {
      return;
    }

    dropdownState.set(wrapper, true);
    wrapper.dataset.open = 'false';
    renderDropdownOptions(select);

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      if (wrapper.dataset.open === 'true') {
        closeAllDropdowns();
      } else {
        openDropdown(wrapper);
      }
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDropdown(wrapper);
      }

      if (event.key === 'Escape') {
        closeAllDropdowns();
      }
    });

    select.addEventListener('change', () => syncDropdownUI(select));
  }

  function enhanceSelect(select) {
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    if (select.closest('.base-select-wrap')) {
      return;
    }

    if (enhancedSelects.has(select)) {
      return;
    }

    const parent = select.parentNode;
    if (!parent) {
      return;
    }

    enhancedSelects.add(select);

    const wrapper = document.createElement('div');
    wrapper.className = 'base-select-wrap';
    wrapper.dataset.open = 'false';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'base-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const valueEl = document.createElement('span');
    valueEl.className = 'base-select-value';

    const chevron = document.createElement('span');
    chevron.className = 'base-select-chevron';
    chevron.setAttribute('aria-hidden', 'true');

    const menu = document.createElement('div');
    menu.className = 'base-select-menu';
    menu.setAttribute('role', 'listbox');

    select.classList.add('base-select-native');
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;

    parent.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    initDropdownBehavior(select);
    syncDropdownUI(select);

    const observer = new MutationObserver(() => {
      renderDropdownOptions(select);
    });
    observer.observe(select, { childList: true, subtree: false, characterData: false });
  }

  function scanForSelects(root = document) {
    root.querySelectorAll('select').forEach((select) => {
      enhanceSelect(select);
    });
  }

  if (!window.__editaSelectValuePatched) {
    const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    const selectedIndexDescriptor = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'selectedIndex'
    );

    if (valueDescriptor && valueDescriptor.configurable) {
      Object.defineProperty(HTMLSelectElement.prototype, 'value', {
        get() {
          return valueDescriptor.get.call(this);
        },
        set(nextValue) {
          valueDescriptor.set.call(this, nextValue);
          queueMicrotask(() => {
            if (this instanceof HTMLSelectElement && this.closest('.base-select-wrap')) {
              syncDropdownUI(this);
            }
          });
        },
      });
    }

    if (selectedIndexDescriptor && selectedIndexDescriptor.configurable) {
      Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
        get() {
          return selectedIndexDescriptor.get.call(this);
        },
        set(nextIndex) {
          selectedIndexDescriptor.set.call(this, nextIndex);
          queueMicrotask(() => {
            if (this instanceof HTMLSelectElement && this.closest('.base-select-wrap')) {
              syncDropdownUI(this);
            }
          });
        },
      });
    }

    window.__editaSelectValuePatched = true;
  }

  scanForSelects();

  if (!window.__editaSelectObserverInstalled) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches('select')) {
            enhanceSelect(node);
          }

          node.querySelectorAll?.('select').forEach((select) => enhanceSelect(select));
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.__editaSelectObserverInstalled = true;
  }

  if (!document.querySelector('.tools-footer-banner')) {
    const footer = document.createElement('div');
    footer.className = 'tools-footer-banner';

    const text = document.createElement('span');
    text.className = 'tools-footer-text';
    text.textContent = 'Want More Tools? Checkout';

    const iconLink = document.createElement('a');
    iconLink.className = 'tools-footer-icon';
    iconLink.href = 'https://edita.tools/';
    iconLink.target = '_blank';
    iconLink.rel = 'noopener noreferrer';
    iconLink.setAttribute('aria-label', 'Open Edita Tools');

    const iconImage = document.createElement('img');
    iconImage.src = '../icon/logo-rounded.png';
    iconImage.alt = 'Edita';

    iconLink.appendChild(iconImage);
    footer.appendChild(text);
    footer.appendChild(iconLink);
    document.body.appendChild(footer);
  }
})();
