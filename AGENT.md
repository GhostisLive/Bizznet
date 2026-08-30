Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
- **Don't assume. Don't hide confusion. Surface tradeoffs.**
- Before implementing, state assumptions explicitly.
- If multiple interpretations exist, present them.
- If a simpler approach exists, say so.
- If something is unclear, stop and ask.

## 2. Simplicity First
- **Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked. No abstractions for single-use code.
- No error handling for impossible scenarios.
- Keep output code as concise and direct as possible.

## 3. Surgical Changes
- **Touch only what you must. Clean up only your own mess.**
- Match existing style.
- Remove imports/variables/functions that your changes made unused.

## 4. Goal-Driven Execution
- **Define success criteria. Loop until verified.**
- Transform tasks into verifiable goals.
- For multi-step tasks, state a brief plan and verify each step.

---

## 5. Website Design & Skill Integration Guidelines
Whenever asked to design/implement a website, landing page, dashboard, components, or UI motion, you must load the most appropriate skill(s) using the `skill` tool before proceeding.

### available_skills mapping:

#### Design Systems & Themes
- **tastemaker**: Use for general high-end UI design, aesthetic tuning, and avoiding generic "AI slop".
- **high-end-visual-design**: Guidelines for luxury / premium layouts, fonts, card containers, and spacing.
- **glass-dark-ui** / **dark-glass-clean-layout** / **glass-dark-mode-clock**: For frosted glass textures, translucent gradients, and clocks.
- **agency-grid-layout-minimal** / **nested-container-clean-agency**: For minimal grids, asymmetrical structures, and nested agency layouts.
- **clean-minimal-beige-light-mode**: For clean paper-toned light neutral layouts.
- **blue-cloudy-clean-modern** / **blue-laser-clean-glass-layout** / **dark-blue-contrasting-clean** / **mesh-gradient-dark-blue-clean**: For premium deep blue, cloudy, and neon laser aesthetics.
- **bright-green-tech-system-webgl** / **tech-green-dark-mode-modern**: For dark mode with emerald/green terminal tech styling.
- **documentary-brutalist-agency**: For billboard typography, asymmetric media collages, and raw brutalist grids.
- **light-mode-paper-technical** / **orange-clean-paper-saas**: For warm paper surfaces, physical frames, and crisp accents.
- **skeuomorphic-ui** / **high-contrast-skeuomorphic-clean**: For pressed, tactile, soft-plastic/metal physical layouts.
- **split-layout-technical** / **technical-wireframe-info-layout** / **framed-grid-layout**: For guide-border lines, wireframes, and split diagnostic layouts.

#### Interactive Components & Motion
- **animate** / **animate-expo**: General UX motion mapping, animation curve tuning, and spring behavior.
- **gsap** / **cinematic-gsap-lenis-motion-system** / **cinematic-scroll-storytelling**: Premium Lenis smooth scroll and ScrollTrigger choreography.
- **scroll-progress-timeline** / **scroll-scrubbed-visual-sequence** / **scroll-scrubbed-word-reveal** / **scroll-world-storytelling**: Scroll-driven storytelling, timelines, word reveals, and progressive fades.
- **masked-reveal** / **staggered-word-reveal**: For words rising/fading into view when scroll enters viewport.
- **cobejs** / **globe-gl**: Interactive 3D globes and data visualization.
- **marquee-loop**: For infinite looping marquees.
- **thinking-orbs**: For premium AI/Agent indicator state circles (thinking, listening, etc.).

#### WebGL / Interactive Particles & Shaders
- **threejs** / **webgl-3d-object** / **webgl-landing-steering**: 3D scene elements, meshes, lights, and performance controls.
- **add-mouse-driven-orbit**: Parallax depth orbit response without OrbitControls.
- **ambient-section-particles** / **build-interactive-particle-trail** / **globe-particles**: Falling/swaying particle fields, custom cursor emitters, and orb clouds.
- **add-shader-cursor-trail** / **shaders-cursor-ripples**: Halftone twinkling Trails and WebGPU ripple shaders.
- **build-threejs-scroll-worlds**: Chapter-aligned 3D worlds.
- **build-wireframe-scan-reveal**: 3D geometry scanlines revealing solid meshes.
- **threejs-landscape** / **threejs-towers** / **threejs-weather**: Procedural terrain, pagodas/towers, and storm systems.
- **vantajs**: Easy WebGL animated canvas scenes.
- **matterjs**: 2D canvas physical body simulation.

#### Layout, Typography & Copy
- **tailwindcss**: Clean practices for Tailwind layout and classes.
- **better-layout** / **better-colors** / **better-typography** / **better-accessibility** / **better-writing** / **better-ui**: Holistic UI quality checklists.
