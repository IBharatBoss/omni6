// src/ui/options-panel.js
import { state } from '../core/state.js';

/**
 * Schema-Driven Dynamic Options Form Generator
 * Generates touch-friendly controls based on the tool's options schema.
 */
export function renderOptionsPanel(tool) {
  const container = document.createElement('div');
  container.className = 'glass-panel-subtle options-container';

  if (!tool.options || tool.options.length === 0) {
    state.set('activeToolOptions', {});
    return container;
  }

  const title = document.createElement('h4');
  title.textContent = 'Configuration Options';
  title.style.fontSize = '0.95rem';
  title.style.fontWeight = '700';
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'options-grid';

  const currentOptions = {};

  tool.options.forEach(opt => {
    currentOptions[opt.id] = opt.default;

    const field = document.createElement('div');
    field.className = 'option-field';

    const header = document.createElement('div');
    header.className = 'option-field-header';

    const label = document.createElement('label');
    label.className = 'option-label';
    label.textContent = opt.label;
    header.appendChild(label);

    if (opt.type === 'range') {
      const badge = document.createElement('span');
      badge.className = 'option-value-badge';
      badge.textContent = `${opt.default}${opt.unit || ''}`;
      header.appendChild(badge);
      field.appendChild(header);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'option-slider';
      slider.min = opt.min ?? 1;
      slider.max = opt.max ?? 100;
      slider.step = opt.step ?? 1;
      slider.value = opt.default;

      slider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        badge.textContent = `${val}${opt.unit || ''}`;
        currentOptions[opt.id] = val;
        state.set('activeToolOptions', { ...currentOptions });
      });

      field.appendChild(slider);
    } else if (opt.type === 'boolean') {
      field.className = 'option-field option-switch-field';
      
      const switchWrapper = document.createElement('label');
      switchWrapper.className = 'switch-control';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(opt.default);

      const sliderSpan = document.createElement('span');
      sliderSpan.className = 'switch-slider';

      checkbox.addEventListener('change', (e) => {
        currentOptions[opt.id] = e.target.checked;
        state.set('activeToolOptions', { ...currentOptions });
      });

      switchWrapper.appendChild(checkbox);
      switchWrapper.appendChild(sliderSpan);

      field.appendChild(label);
      field.appendChild(switchWrapper);
    } else if (opt.type === 'select') {
      field.appendChild(header);

      const select = document.createElement('select');
      select.className = 'option-select';

      (opt.choices || opt.options || []).forEach(choice => {
        const optEl = document.createElement('option');
        optEl.value = typeof choice === 'object' ? choice.value : choice;
        optEl.textContent = typeof choice === 'object' ? choice.label : choice;
        if (optEl.value === opt.default) optEl.selected = true;
        select.appendChild(optEl);
      });

      select.addEventListener('change', (e) => {
        currentOptions[opt.id] = e.target.value;
        state.set('activeToolOptions', { ...currentOptions });
      });

      field.appendChild(select);
    } else if (opt.type === 'number') {
      field.appendChild(header);

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'option-select';
      input.value = opt.default;
      if (opt.min !== undefined) input.min = opt.min;
      if (opt.max !== undefined) input.max = opt.max;

      input.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        currentOptions[opt.id] = val;
        state.set('activeToolOptions', { ...currentOptions });
      });

      field.appendChild(input);
    }

    grid.appendChild(field);
  });

  container.appendChild(grid);
  state.set('activeToolOptions', currentOptions);

  return container;
}
