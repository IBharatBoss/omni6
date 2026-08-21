// src/ui/home-view.js
import { registry } from '../engine/registry.js';
import { bus } from '../core/bus.js';
import { state } from '../core/state.js';

// Tactile 2x3 Color-Block Palette Map matching the exact architectural mockup
const TOOL_PALETTES = {
  'img-to-webp':  { class: 'tile-yellow',    name: 'Buttercup Yellow' },
  'img-to-png':   { class: 'tile-purple',    name: 'Lavender Purple' },
  'img-to-jpg':   { class: 'tile-turquoise', name: 'Aqua Turquoise' },
  'img-compress': { class: 'tile-pink',      name: 'Coral Blossom Pink' },
  'pdf-merge':    { class: 'tile-peach',     name: 'Terracotta Peach' },
  'pdf-split':    { class: 'tile-cyan',      name: 'Cerulean Cyan' },
  'img-resize':   { class: 'tile-amber',     name: 'Warm Amber' },
  'svg-to-png':   { class: 'tile-lime',      name: 'Pastel Lime' }
};

const DEFAULT_CLASSES = ['tile-yellow', 'tile-purple', 'tile-turquoise', 'tile-pink', 'tile-peach', 'tile-cyan', 'tile-amber', 'tile-lime'];

/**
 * Decoupled Home View Component
 * Renders the Surreal Tactile Physical Architecture UI.
 */
export function renderHomeView() {
  const container = document.getElementById('home-view');
  if (!container) return;

  container.innerHTML = '';
  container.className = 'animate-fade-in';

  // 1. Hero Section
  const hero = document.createElement('section');
  hero.className = 'hero-section';
  
  const allTools = registry.getAllTools();

  hero.innerHTML = `
    <div class="hero-badge">
      <span>🔒</span> 100% Client-Side • Zero-Server • Pure Privacy
    </div>
    <h1 class="hero-title">Desktop-Grade Tools,<br>Directly in Your Browser.</h1>
    <p class="hero-subtitle">
      Blazing-fast local transformations for Images, PDFs, Vectors & Documents.<br class="desktop-break"> Files never leave your device.
    </p>
    <div class="hero-search-trigger" id="hero-search-btn">
      <div class="hero-search-placeholder">
        <span class="search-glass-icon">🔍</span>
        <span>Search ${allTools.length} tools, or ask AI Copilot...</span>
      </div>
      <span class="kbd-badge">⌘K</span>
    </div>
  `;

  container.appendChild(hero);

  // Bind search trigger
  const searchBtn = hero.querySelector('#hero-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      bus.emit('commandbar:open');
    });
  }

  // 2. Category Filter Row
  const categoryBar = document.createElement('div');
  categoryBar.className = 'category-filter-bar';

  const categories = registry.getCategories();
  let currentCategory = state.get('activeCategory') || 'All';

  categories.forEach(cat => {
    const pill = document.createElement('button');
    pill.className = `category-pill ${cat === currentCategory ? 'active' : ''}`;
    pill.textContent = cat;

    pill.addEventListener('click', () => {
      currentCategory = cat;
      state.set('activeCategory', cat);

      categoryBar.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      renderToolsGrid(gridContainer, cat);
    });

    categoryBar.appendChild(pill);
  });

  container.appendChild(categoryBar);

  // 3. 2x3 Color-Block Grid (Tactile Anti-Gravity Tiles)
  const gridContainer = document.createElement('div');
  gridContainer.className = 'tools-grid';
  container.appendChild(gridContainer);

  // Initial Grid Render
  renderToolsGrid(gridContainer, currentCategory);
}

function renderToolsGrid(gridContainer, category = 'All') {
  gridContainer.innerHTML = '';
  const tools = registry.getToolsByCategory(category);

  if (tools.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <p>No tools found in this category.</p>
      </div>
    `;
    return;
  }

  tools.forEach((tool, index) => {
    const palette = TOOL_PALETTES[tool.id] || { class: DEFAULT_CLASSES[index % DEFAULT_CLASSES.length] };

    const tile = document.createElement('div');
    tile.className = `tactile-tile ${palette.class} animate-fade-in`;
    tile.dataset.toolId = tool.id;

    tile.innerHTML = `
      <div class="tile-icon-box">
        <span class="tile-icon">${tool.icon || '⚡'}</span>
      </div>
      <div class="tile-content">
        <div class="tile-header">
          <span class="tile-title">${tool.title}</span>
          <span class="tile-category-tag">${tool.category}</span>
        </div>
        <span class="tile-desc">${tool.description}</span>
      </div>
      <div class="tile-action-arrow">→</div>
    `;

    tile.addEventListener('click', () => {
      bus.emit('route:navigate', tool.id);
    });

    gridContainer.appendChild(tile);
  });
}
