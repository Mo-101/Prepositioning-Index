# DeepCAL++ v� - Symbolic Logistics Intelligence Engine

Next-gen humanitarian logistics planner that blends symbolic decision logic with AI (Gemini + Azure) for outbreak readiness, supply prepositioning, and freight optimization.


DeepCAL now supports deterministic readiness scoring plus Grey Relational Analysis for uncertain logistics data and Neutrosophic Grey decision ranking for emergency prepositioning.

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


## Prepositioning Index API Examples

`deepcal` is the internal Python package name. Public-facing deployments should use a neutral service name such as **Prepositioning Index API** or **Logistics Readiness API**.

The FastAPI app exposes OpenAPI docs at `/docs` and JSON schema at `/openapi.json`. Request and response models include field descriptions and validation constraints so API consumers can inspect accepted ranges, required fields, criterion names, and matrix dimensions before sending requests.

### `GET /health`

```bash
curl -s http://localhost:8000/health
```

```json
{
  "status": "ok",
  "service": "deepcal"
}
```

### `POST /readiness`

```bash
curl -s -X POST http://localhost:8000/readiness \
  -H 'Content-Type: application/json' \
  -d '{
    "inventory_coverage": 0.82,
    "route_reliability": 0.74,
    "facility_condition": 0.91,
    "demand_urgency": 0.65
  }'
```

```json
{
  "score": 0.784,
  "normalized_weights": {
    "inventory_coverage": 0.35,
    "route_reliability": 0.25,
    "facility_condition": 0.2,
    "demand_urgency": 0.2
  },
  "contributions": {
    "inventory_coverage": 0.287,
    "route_reliability": 0.185,
    "facility_condition": 0.182,
    "demand_urgency": 0.13
  },
  "explanation": "Readiness is the weighted sum of normalized logistics criteria. The largest contribution is inventory_coverage (0.287000); the lowest raw criterion is demand_urgency (0.650000)."
}
```

### `POST /grey/rank`

```bash
curl -s -X POST http://localhost:8000/grey/rank \
  -H 'Content-Type: application/json' \
  -d '{
    "alternatives": ["A", "B", "C"],
    "criteria": ["coverage", "cost"],
    "matrix": [[80, 10], [60, 20], [100, 15]],
    "criterion_types": {"coverage": "benefit", "cost": "cost"},
    "weights": {"coverage": 0.6, "cost": 0.4},
    "rho": 0.5
  }'
```

```json
{
  "normalized_matrix": [[0.5, 1.0], [0.0, 0.0], [1.0, 0.5]],
  "grey_relational_coefficients": [[0.5, 1.0], [0.333333, 0.333333], [1.0, 0.5]],
  "grey_relational_grades": {"A": 0.7, "B": 0.333333, "C": 0.8},
  "ranking": ["C", "A", "B"],
  "explanation": "Grey Relational Analysis normalized benefit and cost criteria to [0, 1], compared each alternative with an all-one ideal sequence using rho=0.500, and ranked alternatives by weighted grey relational grade. Missing values imputed by column mean: 0."
}
```

### `POST /decision/rank`

```bash
curl -s -X POST http://localhost:8000/decision/rank \
  -H 'Content-Type: application/json' \
  -d '{
    "alternatives": ["forward-hub", "mobile-cache"],
    "criteria": ["stock", "cost"],
    "criteria_weights": {"stock": 0.7, "cost": 0.3},
    "criterion_types": {"stock": "benefit", "cost": "cost"},
    "uncertainty_triples": [
      [
        {"truth": 0.9, "indeterminacy": 0.1, "falsity": 0.1},
        {"truth": 0.3, "indeterminacy": 0.2, "falsity": 0.6}
      ],
      [
        {"truth": 0.5, "indeterminacy": 0.3, "falsity": 0.3},
        {"truth": 0.9, "indeterminacy": 0.1, "falsity": 0.1}
      ]
    ]
  }'
```

```json
{
  "ranking": ["forward-hub", "mobile-cache"],
  "grey_relational_grades": {"forward-hub": 1.0, "mobile-cache": 0.333333},
  "topsis_closeness": {"forward-hub": 1.0, "mobile-cache": 0.0},
  "scores": [
    {
      "alternative": "forward-hub",
      "neutrosophic_scores": {"stock": 0.9, "cost": 0.5},
      "grey_grade": 1.0,
      "topsis_closeness": 1.0,
      "final_score": 1.0,
      "rank": 1,
      "explanation": "forward-hub ranked #1 from the average of grey grade 1.000000 and TOPSIS closeness 1.000000."
    }
  ],
  "explanation": "Neutrosophic triples were converted to deterministic scores, normalized by benefit/cost criterion type, evaluated with Grey Relational Analysis, and combined with TOPSIS closeness for explainable emergency decision ranking."
}
```

## FastAPI Backend Deployment on Vercel
DeepCAL is a Python FastAPI backend, not a Vite frontend deployment. Use these Vercel settings for the backend API:

- **Framework Preset**: `Other`
- **Install Command**: `pip install .`
- **Build Command**: `pip install .`
- **Output Directory**: leave blank
- **Development Command**: `uvicorn deepcal.api:app --host 0.0.0.0 --port 8000`

The serverless entrypoint is `api/index.py`, which exposes `deepcal.api:app` as `handler`, and `vercel.json` routes all requests to the Python function. Verify locally with:

```bash
uvicorn deepcal.api:app --host 0.0.0.0 --port 8000
```

## Deploy Backend to Vercel
1) Deploy the FastAPI backend with Framework Preset `Other`; do not use the Vite preset for this backend service.  
2) Install/build with `pip install .`; leave Output Directory blank.  
3) `api/index.py` exports the FastAPI app as `handler`, and `vercel.json` routes all backend traffic to `api/index.py`.  
4) For the React/Vite UI, use a separate frontend deployment or restore Vite-specific settings in that separate project.  

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

## 🧠 Core Computational Intelligence Framework: DEEPCAL++

DeepCAL++ is structured around a hybrid decision-support system combining:

## 1. 🔺 Neutrosophic AHP (Analytic Hierarchy Process)

AHP is used to derive relative weights of criteria (e.g., time, cost, reliability).

The neutrosophic logic enhancement allows modeling of indeterminacy, uncertainty, and incompleteness in expert judgments.

Instead of classic crisp pairwise comparison matrices, Neutrosophic AHP incorporates truth-membership, indeterminacy-membership, and falsity-membership degrees for each comparison .

This is crucial in logistics where expert opinions are often partially reliable, and exact preferences may be fuzzy or conflicting.

## 2. 🏆 Neutrosophic TOPSIS

Once weights are assigned via Neutrosophic AHP, TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) ranks the alternatives.

In the DeepCAL++ implementation, the positive ideal solution (PIS) and negative ideal solution (NIS) are extended into the neutrosophic domain.

This allows DeepCAL++ to compute closeness coefficients that better reflect real-world ambiguities in the data (e.g., transit time ranges, on-time probabilities) .

Compared to classical TOPSIS, this version improves the resilience of decision-making under imperfect or ambiguous logistics intelligence.

## 3. ⚪ Grey Relational Analysis (GRA)

Grey Theory is integrated to complement the decision process when data is incomplete or partially known, especially in fast-evolving emergency contexts.

GRA computes relational grades between decision alternatives and an ideal sequence based on known reference behavior.

In DeepCAL++, it is used to validate or adjust the final rankings when historical data is sparse or uncertain (e.g., new forwarders with limited prior shipments) .

## 🔍 Integration Flow in DeepCAL++

Data Preprocessing: Normalize KPIs (transit time, cost per kg, on-time rate).

Weight Derivation: Use Neutrosophic AHP for dynamic criteria weighting (context-aware).

Scoring: Apply Neutrosophic TOPSIS to rank options using closeness coefficients.

Stabilization: Apply Grey Relational Analysis to mitigate the effects of missing or weak data.

## 🧪 Scientific Robustness

Supports multi-criteria, multi-alternative decisions with uncertain or vague information.

Designed for logistics under crisis scenarios—health emergencies, disrupted supply chains, volatile borders.

Matches the epistemic uncertainty in real-world humanitarian decision-making environments.

## 🧠 DeepCAL++ is not an interface—it's an Inference Engine.

The term “engine” here is accurate: what powers DeepCAL++ is not hardcoded logic, but adaptive, modular decision intelligence that can evolve with data, context, and emergent uncertainties.

If you're preparing to present this as part of a scientific justification, pitch, or academic validation, I recommend visualizing the flow from:

Input (Forwarder Data + Contextual Priors) →

Fuzzified Weighting (Neutrosophic AHP) →

Ranking (Neutrosophic TOPSIS) →

Correction Layer (Grey Relational Adjustment) →

Final Output (Ranked Decision with Robust Justification)
