# Temas AR — A-Frame + MindAR

## 1. ¿Cómo funciona el tracking actualmente?

MindAR corre visión computacional frame a frame sobre el feed de cámara.
Cuando detecta la imagen target, calcula una **matriz de transformación 4×4**
(posición + rotación del target relativa a la cámara) y se la pasa a A-Frame.
A-Frame renderiza el modelo en esa posición. Si muestras el teléfono, el modelo
se mueve — MindAR recalcula la pose cada frame.

```
Camera frame → MindAR CV → pose matrix → A-Frame entity transform → render
```

---

## 2. Dispositivo con movimiento (giroscopio / acelerómetro)

A-Frame tiene `look-controls` que usa la **Device Orientation API**
(giroscopio + acelerómetro) para rotar la cámara virtual cuando mueves el dispositivo.

- Con `look-controls` activo: si giras el teléfono, la vista 3D rota.
- Útil para escenas 360 o VR, pero **interfiere con MindAR** porque MindAR
  controla la cámara directamente a través del video feed.
- Usarlos juntos sin cuidado causa conflicto: dos sistemas compitiendo por
  controlar la pose de la cámara.

**Solución correcta con MindAR:** dejar `look-controls="enabled: false"` —
ya lo tenemos así. MindAR es la fuente de verdad de la cámara.

---

## 3. ¿Se puede establecer el punto inicial del target y luego actualizar posición con A-Frame?

Sí. El flujo sería:

1. MindAR detecta el target → `targetFound` event → captura la pose inicial.
2. Guardas esa pose (position/rotation) en variables JS.
3. En `targetLost`, en vez de ocultar el modelo, congelas su última posición conocida.
4. A partir de ahí, A-Frame puede animar/mover el modelo desde ese punto con
   `animation`, `tick` component, o Three.js directo.

```js
target.addEventListener('targetFound', () => {
  const entity = target.querySelector('a-gltf-model');
  lastPose = {
    position: entity.getAttribute('position'),
    rotation: entity.getAttribute('rotation'),
  };
});

target.addEventListener('targetLost', () => {
  // No ocultar — congelar en última pose y hacer algo con ella
  burgerEntity.setAttribute('position', lastPose.position);
});
```

Esto da comportamiento tipo "soltar el modelo en el mundo" cuando pierdes el target.

---

## 4. Limitaciones actuales de MindAR Image Tracking

| Tema | Situación |
|---|---|
| Target visible | El modelo solo trackea mientras el target esté en cámara |
| Oclusión | A-Frame no sabe que un objeto real tapa al modelo 3D |
| Múltiples targets | MindAR soporta N targets en un `.mind`, cada uno con su entidad |
| Escala | La escala del modelo es relativa al tamaño de la imagen impresa |
| Iluminación | En condiciones de poca luz, el tracking degrada |

---

## 5. Alternativa futura: WebXR

Los navegadores modernos (Chrome Android) tienen **WebXR Device API** con:
- **Hit testing**: detecta superficies reales (piso, mesa) sin target image.
- **6DOF real**: posición + orientación con sensor fusion.
- A-Frame soporta WebXR via el componente `ar-mode`.

MindAR es el approach correcto para producción cross-browser (funciona en Safari iOS).
WebXR solo funciona en Chrome Android con hardware compatible.

---

## 6. Próximas features a discutir

- [ ] Múltiples productos en el mismo `.mind` (targetIndex: 0, 1, 2...)
- [ ] UI overlay encima de la escena AR (precio, descripción del plato)
- [ ] Animación al detectar el target (scale-in, pop effect)
- [ ] Congelar modelo en última pose cuando se pierde el target
- [ ] Ajuste de escala del modelo según tamaño real del impreso
