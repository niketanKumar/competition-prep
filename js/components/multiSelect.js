// components/multiSelect.js — Universal Multi-Select Dropdown Component
import { esc } from '../lib/utils.js';

export function renderMultiSelectContainer({ id, placeholder, options = [], selected = [] }) {
  const currentSet = new Set(selected);
  let labelText = placeholder;
  if (currentSet.size > 0 && currentSet.size < options.length) {
    const selObjs = options.filter(o => currentSet.has(o.value));
    labelText = selObjs.length === 1 ? selObjs[0].label : `${selObjs[0].label} (+${selObjs.length - 1})`;
  } else if (currentSet.size === options.length && options.length > 0) {
    labelText = `All ${placeholder.replace(/^Select\s*/i, '')}`;
  }

  return `
    <div class="multi-select-wrapper" id="ms-wrap-${id}" style="position:relative;display:inline-block;min-width:180px;">
      <button type="button" class="btn btn-outline form-select ms-trigger-btn" id="ms-btn-${id}" style="display:flex;align-items:center;justify-content:space-between;width:100%;height:38px;padding:0 12px;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:white;">
        <span class="ms-btn-label">${esc(labelText)}</span>
        <span style="margin-left:8px;font-size:.7rem;opacity:.6">▼</span>
      </button>
      <div class="ms-dropdown-menu hidden card shadow-lg" id="ms-menu-${id}" style="position:absolute;top:calc(100% + 4px);left:0;z-index:99999;min-width:240px;max-height:280px;overflow-y:auto;padding:8px;background:white;border:1px solid var(--border);border-radius:var(--r-md);box-shadow:0 10px 30px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin-bottom:6px;border-bottom:1px solid var(--border);font-size:.78rem;font-weight:700;color:var(--text-3);">
          <button type="button" class="btn btn-ghost btn-xs ms-select-all" data-id="${id}" style="padding:2px 6px;font-size:.75rem">Select All</button>
          <button type="button" class="btn btn-ghost btn-xs ms-clear-all" data-id="${id}" style="padding:2px 6px;font-size:.75rem;color:var(--danger)">Clear</button>
        </div>
        <div class="ms-options-list" style="display:flex;flex-direction:column;gap:2px;">
          ${options.map(opt => {
            const isChecked = currentSet.has(opt.value);
            return `
              <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;font-size:.84rem;color:var(--text);user-select:none;transition:background .15s" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" class="ms-option-chk-${id}" value="${esc(opt.value)}" ${isChecked ? 'checked' : ''} style="accent-color:var(--primary);cursor:pointer">
                <span>${opt.icon ? `${opt.icon} ` : ''}${esc(opt.label)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function wireMultiSelect({ id, options = [], selected = [], onChange }) {
  const wrap = document.getElementById(`ms-wrap-${id}`);
  if (!wrap) return;

  const btn = document.getElementById(`ms-btn-${id}`);
  const menu = document.getElementById(`ms-menu-${id}`);
  const labelSpan = wrap.querySelector('.ms-btn-label');
  const chks = wrap.querySelectorAll(`.ms-option-chk-${id}`);
  const selectAllBtn = wrap.querySelector('.ms-select-all');
  const clearAllBtn = wrap.querySelector('.ms-clear-all');

  let currentSelected = new Set(selected);

  function getButtonLabel() {
    if (currentSelected.size === 0) return wrap.dataset.placeholder || 'All Selected';
    if (currentSelected.size === options.length) return `All ${options.length} Selected`;
    const selectedObj = options.filter(o => currentSelected.has(o.value));
    if (selectedObj.length === 1) return selectedObj[0].label;
    return `${selectedObj[0].label} (+${selectedObj.length - 1})`;
  }

  function updateState() {
    if (labelSpan) labelSpan.textContent = getButtonLabel();
    if (onChange) onChange(Array.from(currentSelected));
  }

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCurrentlyHidden = menu?.classList.contains('hidden');
    document.querySelectorAll('.ms-dropdown-menu').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('.multi-select-wrapper').forEach(w => w.style.zIndex = '1');

    if (isCurrentlyHidden) {
      menu?.classList.remove('hidden');
      wrap.style.zIndex = '1000';
    } else {
      menu?.classList.add('hidden');
      wrap.style.zIndex = '1';
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      menu?.classList.add('hidden');
      wrap.style.zIndex = '1';
    }
  });

  chks.forEach(chk => {
    chk.addEventListener('change', () => {
      if (chk.checked) currentSelected.add(chk.value);
      else currentSelected.delete(chk.value);
      updateState();
    });
  });

  selectAllBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    options.forEach(o => currentSelected.add(o.value));
    chks.forEach(c => c.checked = true);
    updateState();
  });

  clearAllBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentSelected.clear();
    chks.forEach(c => c.checked = false);
    updateState();
  });
}
