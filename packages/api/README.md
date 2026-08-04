# packages/api

Citrus FastAPI backend (Google SSO → JWT, MongoDB).

Canonical home is the **[citrus](https://github.com/r2pen2/citrus)** monorepo.  
Standalone history: [citrus-fastapi](https://github.com/r2pen2/citrus-fastapi).

```bash
py -3 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
pytest -q
```

See repo root `README.md` and `deploy/` for Docker / glados deploy.
