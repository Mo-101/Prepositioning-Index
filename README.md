# DeepCAL++ v� - Symbolic Logistics Intelligence Engine

Next-gen humanitarian logistics planner that blends symbolic decision logic with AI (Gemini + Azure) for outbreak readiness, supply prepositioning, and freight optimization.

## What the App Does
- **Oracle view**: Configure a shipment, rank forwarders with a TOPSIS-style score (time, cost/kg, reliability, historical weight), and get an "Oracle" AI insight. The UI shows which model replied (`gemini`, `azure`, or `local` fallback).
- **LPI view**: Generate and refine a Logistic Prepositioning Index plan via Azure AI (stock vs need, coverage, lead time, surge margin, geographic risk) with chat-based updates.
- **Dashboard view**: Full-width map/metrics/tables for outbreaks, inventory positioning, shipment history, and corridor performance.
- **Floating copilot**: Corner chat for quick Q&A using Azure AI with graceful fallback text.

## AI Routing Logic
1) **Azure Phi-4** (primary)  
2) **Gemini 1.5 Flash** (fallback)  
3) **Local heuristic** (if both unavailable)  

The badge in the Oracle panel shows the active provider. The copilot and LPI planner use the same Azure service with fallback messaging.

## Environment Variables
Set real keys in `.env.local` (gitignored). `.env` and `.env.example` are templates. Keep Azure keys server-side and call via the Vercel API route (`/api/azure-chat`).

```env
# Primary AI routing
VITE_GEMINI_API_KEY=your_gemini_key
VITE_AZURE_PROXY_PATH=/api/azure-chat    # client calls this, key stays server-side

# Backend-only (used by the proxy)
AZURE_CHAT_ENDPOINT=https://your-azure-endpoint/openai/deployments/Phi-4/chat/completions?api-version=2024-05-01-preview
AZURE_CHAT_KEY=your_azure_key

# (Optional) legacy direct injection if you intentionally allow browser calls
VITE_AZURE_CHAT_ENDPOINT=$AZURE_CHAT_ENDPOINT
VITE_AZURE_CHAT_KEY=$AZURE_CHAT_KEY

# Optional legacy/alt Azure names (used by resolver fallback)
VITE_END_POINT_TARGET_URI=$VITE_AZURE_CHAT_ENDPOINT
VITE_END_POINT_KEY=$VITE_AZURE_CHAT_KEY
VITE_FOUNDRY_PROJECT_ENDPOINT=https://your-azure-endpoint/api/projects/your-project/endpoints/chat/completions
VITE_AZURE_AI_SERVICES_ENDPOINT=https://your-azure-cognitiveservices-endpoint/

# Speech (if enabled)
VITE_SPEECH_TO_TEXT_ENDPOINT=https://<region>.stt.speech.microsoft.com
VITE_TEXT_TO_SPEECH_ENDPOINT=https://<region>.tts.speech.microsoft.com

# Maps (optional)
VITE_MAPBOX_TOKEN=your-mapbox-token
```

## Quick Start
1) `npm install`  
2) Copy `.env.example` -> `.env.local` and add your keys.  
3) `npm run dev` and open the dev server URL.  

## Preflight / Health Check
- `npm run health` validates that Azure chatbot/LPI credentials exist (fails fast if missing).
- `npm run health:live` sends a short ping to Azure and Gemini; run it when keys are loaded and you want proof of life before deploy.

## Deploy to Vercel
1) Run `npm run health` locally to confirm Azure keys are wired.  
2) In Vercel → Settings → Environment Variables, add: `VITE_AZURE_CHAT_ENDPOINT`, `VITE_AZURE_CHAT_KEY`, `VITE_GEMINI_API_KEY` (optional), plus any map/speech keys you use.  
3) Build settings: Framework `Vite`, Build Command `npm run build`, Output Directory `dist`, Node.js 20.  
4) Deploy from the connected repo or with `vercel --prod`.  
5) After deploy, hit the floating chatbot or LPI view; if credentials are missing you will see the heuristic fallback noted in the preflight.  

## Key Files
- `components/InputPanel.tsx` / `components/OutputPanel.tsx` - Oracle UI + model badge.
- `components/LpiPage.tsx` - LPI planner + chat refinement.
- `components/Dashboard.tsx` - Logistics pulse board.
- `components/FloatingChatbot.tsx` - Azure copilot widget.
- `services/geminiService.ts` - Gemini insight with Azure/local fallback.
- `services/azureChatService.ts` - Azure orchestration + LPI generation/refinement with heuristic fallback.
- `services/supplyChainService.ts` - Estimator, replenishment, and kit logic.
- `services/indexCalculator.ts`, `services/indicatorService.ts`, `services/outbreakService.ts` - PI/LPI inputs and synthetic outbreak data.

## Current Flow (Intended)
Outbreak monitoring (mocked) -> demand estimation (kits/needs) -> gap vs inventory -> freight ranking + AI insight. Ready to attach live feeds (WHO/IDSR) and inventory APIs.

## Suggested Next Steps
- Hook real outbreak feeds and warehouse data sources.
- Add "Why this forwarder?" explanations and ETA predictions via carrier APIs.
- Scenario presets (dual outbreaks, customs delays, corridor closures).
- Centralize hazard/kit schemas in `types.ts` for stricter typing.
