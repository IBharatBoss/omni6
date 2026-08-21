// src/ui/dropzone.js
import { state } from '../core/state.js';
import { bus } from '../core/bus.js';
import { memory } from '../core/memory.js';

/**
 * Universal Batch Queue & Results Manager
 * Supports individual downloads, removing items, and batch ZIP archiving.
 */
export function initDropzoneUI() {
  bus.on('state:change', (s) => {
    const queueContainer = document.getElementById('studio-queue-area');
    if (queueContainer && s.currentView === 'studio') {
      renderBatchQueue(queueContainer, s.batchQueue, s.processedFiles, s.isProcessing);
    }
  });
}

export function renderBatchQueue(container, queue, processedFiles, isProcessing) {
  container.innerHTML = '';
  if (!queue || queue.length === 0) return;

  const section = document.createElement('div');
  section.className = 'batch-section animate-fade-in';

  // 1. Batch Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'batch-toolbar';

  const stats = document.createElement('div');
  stats.className = 'batch-stats';
  const doneCount = processedFiles.filter(p => p.status === 'done').length;
  stats.innerHTML = `Queue: <strong>${queue.length} file${queue.length > 1 ? 's' : ''}</strong> ${doneCount > 0 ? `(${doneCount} processed)` : ''}`;
  toolbar.appendChild(stats);

  const actions = document.createElement('div');
  actions.className = 'batch-actions';

  // Download All as ZIP (if more than 1 file is done)
  if (doneCount > 1) {
    const zipBtn = document.createElement('button');
    zipBtn.className = 'glass-btn btn-small';
    zipBtn.innerHTML = `<span>📦</span> Download All as ZIP`;
    zipBtn.addEventListener('click', async () => {
      await downloadAllAsZip(processedFiles);
    });
    actions.appendChild(zipBtn);
  }

  // Clear Queue Button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'glass-btn btn-small';
  clearBtn.innerHTML = `<span>🗑️</span> Clear Queue`;
  clearBtn.addEventListener('click', () => {
    state.clearQueue();
  });
  actions.appendChild(clearBtn);

  toolbar.appendChild(actions);
  section.appendChild(toolbar);

  // 2. Queue Cards List
  const list = document.createElement('div');
  list.className = 'batch-queue-list';

  queue.forEach((file, index) => {
    const processed = processedFiles.find(p => p.index === index) || {
      progress: 0,
      status: 'pending'
    };

    const card = document.createElement('div');
    card.className = 'glass-card queue-card';

    // Top Row: Thumbnail + Info
    const topRow = document.createElement('div');
    topRow.className = 'queue-card-top';

    // Thumbnail Preview
    const thumb = document.createElement('div');
    thumb.className = 'queue-thumb';

    if (file.type && file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = memory.createObjectURL(file);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = 'var(--radius-sm)';
      thumb.appendChild(img);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      thumb.textContent = '📄';
    } else {
      thumb.textContent = '📁';
    }

    topRow.appendChild(thumb);

    // Info
    const info = document.createElement('div');
    info.className = 'queue-info';

    const name = document.createElement('div');
    name.className = 'queue-filename';
    name.title = file.name;
    name.textContent = file.name;
    info.appendChild(name);

    const sizeFlow = document.createElement('div');
    sizeFlow.className = 'queue-size-flow';

    const origFormatted = formatBytes(file.size);

    if (processed.status === 'done' && processed.result) {
      const procFormatted = formatBytes(processed.result.processedSize);
      const savings = file.size > 0 ? ((file.size - processed.result.processedSize) / file.size) * 100 : 0;
      
      sizeFlow.innerHTML = `${origFormatted} → <strong>${procFormatted}</strong> `;
      if (savings > 0) {
        sizeFlow.innerHTML += `<span class="savings-chip">-${savings.toFixed(1)}%</span>`;
      }
    } else if (processed.status === 'error') {
      sizeFlow.innerHTML = `<span style="color: var(--color-danger)">Processing failed</span>`;
    } else if (processed.status === 'processing') {
      sizeFlow.textContent = `Processing... ${processed.progress || 0}%`;
    } else {
      sizeFlow.textContent = `Queued • ${origFormatted}`;
    }

    info.appendChild(sizeFlow);
    topRow.appendChild(info);
    card.appendChild(topRow);

    // Progress Bar (if processing)
    if (processed.status === 'processing') {
      const progressBg = document.createElement('div');
      progressBg.className = 'queue-progress';
      const fill = document.createElement('div');
      fill.className = 'queue-progress-bar';
      fill.style.width = `${processed.progress || 10}%`;
      progressBg.appendChild(fill);
      card.appendChild(progressBg);
    }

    // Card Actions
    const cardActions = document.createElement('div');
    cardActions.className = 'queue-card-actions';

    if (processed.status === 'done' && processed.result?.blob) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'glass-btn btn-small';
      downloadBtn.innerHTML = `<span>⬇</span> Download`;
      downloadBtn.addEventListener('click', () => {
        downloadBlob(processed.result.blob, processed.result.fileName || file.name);
      });
      cardActions.appendChild(downloadBtn);
    }

    if (!isProcessing) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'icon-btn';
      removeBtn.style.width = '32px';
      removeBtn.style.height = '32px';
      removeBtn.style.fontSize = '0.85rem';
      removeBtn.title = 'Remove file';
      removeBtn.innerHTML = '✕';
      removeBtn.addEventListener('click', () => {
        state.removeQueueItem(index);
      });
      cardActions.appendChild(removeBtn);
    }

    card.appendChild(cardActions);
    list.appendChild(card);
  });

  section.appendChild(list);
  container.appendChild(section);
}

/**
 * Client-Side ZIP Generator (Dynamically loads JSZip on demand)
 */
async function downloadAllAsZip(processedFiles) {
  const completed = processedFiles.filter(p => p.status === 'done' && p.result?.blob);
  if (completed.length === 0) return;

  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  const zip = new JSZip();
  completed.forEach(item => {
    zip.file(item.result.fileName, item.result.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `OmniTools_Batch_${Date.now()}.zip`);
}

function downloadBlob(blob, fileName) {
  const url = memory.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
