"""Dataset cleaning helpers.

These helpers normalize raw Kaggle CSVs into a consistent tabular shape.
That is important because each disease dataset uses different column names
and some fields may be messy, missing, or duplicated.
"""

from __future__ import annotations

import re
from typing import Iterable

import numpy as np
import pandas as pd


def normalize_column_name(value: str) -> str:
    """Convert a raw column label into a lowercase snake_case name."""

    cleaned = re.sub(r"[^0-9a-zA-Z]+", "_", str(value).strip().lower())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned


def normalize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    """Apply consistent naming so model code can work across datasets."""

    renamed = {column: normalize_column_name(column) for column in frame.columns}
    return frame.rename(columns=renamed)


def coerce_binary_series(series: pd.Series) -> pd.Series:
    """Map common yes/no and true/false labels to 0/1 when possible."""

    if series.dtype.kind in {"b", "i", "u", "f"}:
        return series

    normalized = series.astype(str).str.strip().str.lower()
    mapping = {
        "yes": 1,
        "y": 1,
        "true": 1,
        "1": 1,
        "no": 0,
        "n": 0,
        "false": 0,
        "0": 0,
    }
    mapped = normalized.map(mapping)
    if mapped.notna().mean() >= 0.8:
        return mapped.fillna(series)
    return series


def clean_dataframe(frame: pd.DataFrame) -> pd.DataFrame:
    """Clean a raw dataset before training.

    The cleaning steps are intentionally simple and explainable: normalize
    names, remove duplicates, coerce binary labels, replace infinities, and
    fill missing values with median/mode values.
    """

    cleaned = normalize_columns(frame.copy())
    cleaned = cleaned.replace([np.inf, -np.inf], np.nan)
    cleaned = cleaned.drop_duplicates().reset_index(drop=True)

    for column in cleaned.columns:
        cleaned[column] = coerce_binary_series(cleaned[column])

    for column in cleaned.columns:
        if pd.api.types.is_numeric_dtype(cleaned[column]):
            cleaned[column] = cleaned[column].fillna(cleaned[column].median())
        else:
            mode_values = cleaned[column].mode(dropna=True)
            fallback = mode_values.iloc[0] if not mode_values.empty else "unknown"
            cleaned[column] = cleaned[column].fillna(fallback).astype(str)

    return cleaned


def normalize_payload_keys(payload: dict[str, object]) -> dict[str, object]:
    """Normalize incoming API keys so payloads match cleaned dataset columns."""

    return {normalize_column_name(key): value for key, value in payload.items()}


def ordered_unique(values: Iterable[str]) -> list[str]:
    """Return unique values while preserving their first-seen order."""

    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            output.append(value)
    return output
