"""Vercel serverless entrypoint for the DeepCAL FastAPI app."""

from deepcal.api import app

handler = app
