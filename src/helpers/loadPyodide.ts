// pyodide-worker.ts
const workerCode = `
let pyodide = null;

async function loadPyodideInWorker() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.6/full/pyodide.js');
  
  pyodide = await loadPyodide();
  
  return true;
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'init':
        await loadPyodideInWorker();
        // Load packages automatically
        await pyodide.loadPackage('sympy');
        result = { success: true };
        break;
        
      case 'runPython':
        result = { value: pyodide.runPython(payload.code) };
        break;
        
      case 'runPythonAsync':
        result = { value: await pyodide.runPythonAsync(payload.code) };
        break;
        
      case 'runPythonWithMatplotlib':
        // Load matplotlib if not already loaded
        if (!pyodide.globals.get('matplotlib')) {
          await pyodide.loadPackage('matplotlib');
        }
        result = { value: pyodide.runPython(payload.code) };
        break;
        
      default:
        throw new Error(\`Unknown command: \${type}\`);
    }
    
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ 
      id, 
      success: false, 
      error: error.message || 'Unknown error' 
    });
  }
};
`;

// pyodide-interface.ts
interface PyodideInterface {
  runPython(code: string): any;
  runPythonAsync(code: string): Promise<any>;
  runPythonWithMatplotlib(code: string): Promise<any>;
  sendMessage(type: string, payload?: any): Promise<any>;
  terminate(): void;
}

class PyodideWorkerInterface implements Partial<PyodideInterface> {
  private worker: Worker;
  private messageId = 0;
  private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

  constructor(worker: Worker) {
    this.worker = worker;

    this.worker.onmessage = (event) => {
      const { id, success, result, error } = event.data;
      const pending = this.pendingMessages.get(id);

      if (pending) {
        if (success) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(error));
        }
        this.pendingMessages.delete(id);
      }
    };
  }

  sendMessage(type: string, payload?: any): Promise<any> {
    const id = this.messageId++;

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  async runPython(code: string): Promise<any> {
    const result = await this.sendMessage('runPython', { code });
    return result.value;
  }

  async runPythonAsync(code: string): Promise<any> {
    const result = await this.sendMessage('runPythonAsync', { code });
    return result.value;
  }

  async runPythonWithMatplotlib(code: string): Promise<any> {
    const result = await this.sendMessage('runPythonWithMatplotlib', { code });
    return result.value;
  }

  terminate(): void {
    // Reject all pending messages
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingMessages.clear();

    // Terminate the worker
    this.worker.terminate();
  }
}

// Main loading function
export async function loadPyodideInBackground(): Promise<PyodideInterface | undefined> {
  try {
    // Create worker from blob URL
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const pyodideInterface = new PyodideWorkerInterface(worker);

    // Initialize Pyodide in the worker and load sympy
    await pyodideInterface.sendMessage('init');
    await pyodideInterface.runPython(`
    import re
    import ast
    import sympy
    from sympy.printing.latex import LatexPrinter
    import numbers
    import base64
    import io
    import json
    pass
    `);

    // Clean up blob URL
    URL.revokeObjectURL(workerUrl);

    return pyodideInterface;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
