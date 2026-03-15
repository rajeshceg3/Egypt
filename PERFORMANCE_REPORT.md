# Performance Optimization Intelligence Report

## Overview
This report details the findings from a comprehensive performance investigation of the Three.js / WebGL / React application. Multiple bottlenecks have been identified across the rendering pipeline, React architecture, and GPU compute stages.

## Findings Summary

| Severity | Issue Category | Description |
|---|---|---|
| Critical | React Re-render Storms | CPU bottleneck caused by rapid state updates in overlay components. |
| Critical | GPU Overdraw | The entire scene is re-rendered every frame for static shadows. |
| High | Shader Complexity | Heavy procedural noise (FBM) evaluated per-pixel with excessive octaves. |
| High | Excessive Geometry | Dense terrain geometry causing unnecessary vertex shader overhead. |
| Medium | Matrix Recalculations | Static objects recalculating their world matrices every frame. |

---

### 1. React Render Storms (CPU Bottleneck)
*   **Severity:** Critical
*   **Location:** `src/components/TelemetryHUD.tsx`, `src/components/GeometricOverlay.tsx`
*   **Performance Impact:** React is attempting to reconcile the virtual DOM up to 60 times a second. `TelemetryHUD.tsx` calls `setState` repeatedly via `requestAnimationFrame`. `GeometricOverlay.tsx` updates `useState` inside a `useFrame` loop. This spikes the Main Thread CPU usage, starves the GPU of draw commands, and guarantees frame drops.
*   **Reproduction:** Run the application and capture a Chrome Performance Profile. Observe massive 'Scripting' time and continuous React commit phases.
*   **Root Cause:** Utilizing React state (`useState`) to drive high-frequency animations instead of mutable refs and direct DOM manipulation.
*   **Recommended Fix:** Replace `useState` with `useRef` for values updated per-frame. Mutate the DOM directly using `ref.current.innerText` or `ref.current.style.opacity`.

### 2. Excessive GPU Overdraw via Contact Shadows
*   **Severity:** Critical
*   **Location:** `src/components/Experience.tsx` (`<ContactShadows>`)
*   **Performance Impact:** Cuts frame rate nearly in half. `<ContactShadows>` captures the scene from below to generate an ambient occlusion/shadow texture. Without being told to bake once, it performs this render pass every single frame, doubling the draw calls.
*   **Reproduction:** Inspect WebGL draw calls using Spector.js. The number of draw calls is roughly double the expected amount for the visible scene.
*   **Root Cause:** Missing `frames={1}` and `resolution={512}` constraints on static shadows.
*   **Recommended Fix:** Add `frames={1}` so the shadow is only baked on initialization. Lower the resolution to `512` or `1024` to save VRAM.

### 3. Procedural Shader Overhead (High FBM Octaves)
*   **Severity:** High
*   **Location:** `src/components/Pyramid.tsx`, `src/components/Terrain.tsx`
*   **Performance Impact:** Significant GPU bottleneck in the fragment shading phase. `Pyramid.tsx` evaluates a 5-octave 3D Simplex noise function (`fbm_custom`) multiple times per pixel. `Terrain.tsx` also calculates heavy domain-warped FBM across high-resolution geometry.
*   **Reproduction:** Analyze GPU load; observe heavy ALU (Arithmetic Logic Unit) utilization.
*   **Root Cause:** Unnecessary precision/octaves in noise-based procedural textures.
*   **Recommended Fix:** Reduce the loop constraint from 5 octaves to 2 or 3 in the `fbm_custom` and `fbm_terrain` shader chunks.

### 4. Excessive Vertex Density on Terrain
*   **Severity:** High
*   **Location:** `src/components/Terrain.tsx`
*   **Performance Impact:** The `planeGeometry` uses `args={[1000, 1000, 256, 256]}`, resulting in 65,536 vertices. Each vertex calculates complex Simplex noise for displacement.
*   **Reproduction:** Check Three.js stats for vertex count and triangle count.
*   **Root Cause:** Overly dense subdivision for a terrain that is mostly hidden or obscured by distance.
*   **Recommended Fix:** Halve the subdivisions to `args={[1000, 1000, 128, 128]}` (reduces vertices by ~75% to 16,384) while relying on the fragment shader's normal mapping for micro-details.

### 5. Static Mesh Matrix Recalculations
*   **Severity:** Medium
*   **Location:** `src/components/Pyramid.tsx`, `src/components/Terrain.tsx`
*   **Performance Impact:** Minor CPU overhead spent calculating `.updateMatrixWorld()` for objects that never move.
*   **Root Cause:** Three.js updates matrices for all objects by default unless instructed otherwise.
*   **Recommended Fix:** Add `matrixAutoUpdate={false}` to the static `<mesh>` definitions for the pyramids and terrain.

---
## Optimization Roadmap
1. Refactor `TelemetryHUD` and `GeometricOverlay` to bypass React state for high-frequency updates.
2. Bake `<ContactShadows>` and set `matrixAutoUpdate={false}` on static geometry.
3. Optimize shader loops by reducing FBM octaves and simplifying vertex payload.
