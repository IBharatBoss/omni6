// src/core/worker-pool.js
// Basic implementation for a pool of web workers if needed, 
// or providing an abstraction to spawn workers dynamically.

export class WorkerPool {
  constructor(size = navigator.hardwareConcurrency || 4) {
    this.size = size;
    this.workers = [];
    this.queue = [];
  }

  async run(workerScript, data) {
    return new Promise((resolve, reject) => {
      // Inline worker creation using Blob for completely zero-server setups without separate files
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      
      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
      };
      
      worker.postMessage(data);
    });
  }
}

export const workerPool = new WorkerPool();
