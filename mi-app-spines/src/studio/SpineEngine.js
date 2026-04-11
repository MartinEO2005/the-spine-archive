import { fabric } from 'fabric';

export class SpineEngine {
  constructor(canvasElementId, width, height) {
    // Inicializamos el Canvas de Fabric
    this.canvas = new fabric.Canvas(canvasElementId, {
      width: width,
      height: height,
      backgroundColor: '#1a1a1a',
      preserveObjectStacking: true // Fundamental para que las capas funcionen bien
    });

    // Portapapeles interno
    this._clipboard = null;

    // Configuración global de los "tiradores" (cuadrantes) para que se vean profesionales
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#007fd4',
      borderColor: '#007fd4',
      cornerSize: 12,
      padding: 5,
      cornerStyle: 'circle'
    });

    this.setupKeyboardShortcuts();
  }

  // --- MÉTODOS DE CREACIÓN ---
  
  addImageFromURL(url) {
    fabric.Image.fromURL(url, (img) => {
      img.set({
        left: this.canvas.width / 2,
        top: this.canvas.height / 2,
        originX: 'center',
        originY: 'center',
      });
      // Escalar la imagen si es muy grande
      if (img.width > 200) img.scaleToWidth(200);
      
      this.canvas.add(img);
      this.canvas.setActiveObject(img);
    }, { crossOrigin: 'anonymous' }); // Evita errores CORS al exportar
  }

  addText(textString) {
    const text = new fabric.IText(textString, {
      left: this.canvas.width / 2,
      top: this.canvas.height / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'sans-serif',
      fill: '#ffffff',
      fontSize: 32,
    });
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
  }

  addShape(type) {
    let shape;
    if (type === 'rect') {
      shape = new fabric.Rect({ width: 100, height: 100, fill: '#d40000', left: 100, top: 100 });
    } else if (type === 'circle') {
      shape = new fabric.Circle({ radius: 50, fill: '#007fd4', left: 100, top: 100 });
    }
    if (shape) {
      this.canvas.add(shape);
      this.canvas.setActiveObject(shape);
    }
  }

  // --- MÉTODOS DE CAPAS ---
  
  bringForward() {
    const obj = this.canvas.getActiveObject();
    if (obj) this.canvas.bringForward(obj);
  }

  sendBackwards() {
    const obj = this.canvas.getActiveObject();
    if (obj) this.canvas.sendBackwards(obj);
  }

  deleteSelected() {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length) {
      this.canvas.discardActiveObject();
      activeObjects.forEach((obj) => this.canvas.remove(obj));
    }
  }

  // --- PORTAPAPELES (COPIAR Y PEGAR NATIVO DEL LIENZO) ---
  
  copy() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned) => {
        this._clipboard = cloned;
      });
    }
  }

  paste() {
    if (!this._clipboard) return;
    this._clipboard.clone((clonedObj) => {
      this.canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 20,
        top: clonedObj.top + 20,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = this.canvas;
        clonedObj.forEachObject((obj) => this.canvas.add(obj));
        clonedObj.setCoords();
      } else {
        this.canvas.add(clonedObj);
      }
      this._clipboard.top += 20;
      this._clipboard.left += 20;
      this.canvas.setActiveObject(clonedObj);
      this.canvas.requestRenderAll();
    });
  }

  // --- ATAJOS DE TECLADO ---
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        this.copy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        this.paste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        this.copy();
        setTimeout(() => this.paste(), 50);
      }
    });
  }

  // Destruir el canvas (útil para cuando React desmonta el componente)
  dispose() {
    this.canvas.dispose();
  }
}