# Bugs log

## 2026-05-12 — Vite build: missing `EduPrimitives` module

1. **Issue:** `npm run build` in `frontend/` failed with `Could not resolve "./EduPrimitives" from "BrowserBridgeExplainer.tsx"`.
2. **Why:** During the split of shared primitives into `TermTip.tsx` / `NetworkFlow.tsx` / `LifecycleBar.tsx`, `BrowserBridgeExplainer.tsx` still imported `TermTip` from the removed `EduPrimitives` module.
3. **Fix:** Changed the import to `import { TermTip } from "./TermTip";` in `frontend/src/components/network/BrowserBridgeExplainer.tsx`.
4. **Verification:** `cd frontend && npm run build` (success). `cd backend && ./mvnw test` (success, run separately in the same session).
