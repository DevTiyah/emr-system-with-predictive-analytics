"""Compatibility wrapper for the FastAPI application.

The project now runs on FastAPI, but this module is kept so older entry
points that import or execute app.py continue to work.
"""

from main import app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
