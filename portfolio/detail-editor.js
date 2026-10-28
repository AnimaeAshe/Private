(() => {
  const settingsElement = document.querySelector('#detail-crop-settings');
  if (!settingsElement) return;
  const defaults = JSON.parse(settingsElement.textContent);
  const local = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  let settings = structuredClone(defaults);
  const storageKey = 'ashe-detail-crop-v1';
  if (local) {
    try { settings = JSON.parse(localStorage.getItem(storageKey)) || settings; } catch {}
  }
  let editing = false;
  const figures = [...document.querySelectorAll('.sheet-detail')];
  const saveLocal = () => { try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch {} };
  const render = (index) => {
    const button = figures[index].querySelector('button');
    const img = button.querySelector('img');
    if (!img.naturalWidth || !button.clientWidth) return;
    const state = settings[index];
    const scale = Math.max(button.clientWidth / img.naturalWidth, button.clientHeight / img.naturalHeight) * state.zoom;
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    Object.assign(img.style, {
      position: 'absolute', inset: 'auto', maxWidth: 'none',
      width: `${width}px`, height: `${height}px`,
      left: `${button.clientWidth / 2 - state.x * width}px`,
      top: `${button.clientHeight / 2 - state.y * height}px`,
      transform: 'none', transition: 'none', pointerEvents: 'none'
    });
  };
  figures.forEach((figure, index) => {
    const button = figure.querySelector('button');
    const img = button.querySelector('img');
    img.addEventListener('load', () => render(index));
    new ResizeObserver(() => render(index)).observe(button);
    render(index);
    let drag = null;
    button.addEventListener('click', (event) => {
      if (editing) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    button.addEventListener('pointerdown', (event) => {
      if (!editing) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      drag = { x: event.clientX, y: event.clientY, ...settings[index] };
      drag.px = event.clientX; drag.py = event.clientY;
    });
    button.addEventListener('pointermove', (event) => {
      if (!drag) return;
      settings[index].x = Math.max(0, Math.min(1, drag.x - (event.clientX - drag.px) / img.clientWidth));
      settings[index].y = Math.max(0, Math.min(1, drag.y - (event.clientY - drag.py) / img.clientHeight));
      render(index); saveLocal();
    });
    button.addEventListener('pointerup', () => { drag = null; });
    button.addEventListener('pointercancel', () => { drag = null; });
    if (!local) return;
    const controls = document.createElement('div');
    controls.dataset.cropUi = '';
    controls.className = 'crop-controls';
    controls.hidden = true;
    controls.innerHTML = `<label>缩放 <input type="range" min="1" max="5" step="0.01" value="${settings[index].zoom}" aria-label="细节 ${index + 1} 缩放"></label><button type="button">重置</button>`;
    controls.querySelector('input').addEventListener('input', (event) => {
      settings[index].zoom = Number(event.target.value); render(index); saveLocal();
    });
    controls.querySelector('button').addEventListener('click', () => {
      settings[index] = structuredClone(defaults[index]);
      controls.querySelector('input').value = settings[index].zoom;
      render(index); saveLocal();
    });
    figure.appendChild(controls);
  });
  if (!local) return;
  const toolbar = document.createElement('div');
  toolbar.dataset.cropUi = '';
  toolbar.className = 'crop-toolbar';
  toolbar.innerHTML = '<button type="button" class="crop-toggle">调整细节取景</button><span hidden>拖动图片调整位置，滑动缩放</span><button type="button" class="crop-export" hidden>保存网页文件</button>';
  document.body.appendChild(toolbar);
  toolbar.querySelector('.crop-toggle').addEventListener('click', (event) => {
    editing = !editing;
    document.body.classList.toggle('crop-editing', editing);
    document.querySelectorAll('.crop-controls').forEach((controls) => controls.hidden = !editing);
    toolbar.querySelector('span').hidden = !editing;
    toolbar.querySelector('.crop-export').hidden = !editing;
    event.target.textContent = editing ? '结束调整' : '调整细节取景';
  });
  toolbar.querySelector('.crop-export').addEventListener('click', () => {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-crop-ui]').forEach((node) => node.remove());
    clone.querySelector('body').classList.remove('crop-editing');
    clone.querySelector('#detail-crop-settings').textContent = JSON.stringify(settings);
    clone.querySelectorAll('.sheet-detail img').forEach((img) => img.removeAttribute('style'));
    const url = URL.createObjectURL(new Blob(['<!doctype html>\n', clone.outerHTML], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'characters.html'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
