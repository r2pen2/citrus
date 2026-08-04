from enum import Enum

from pydantic import BaseModel, Field


class LegalCurrency(str, Enum):
    USD = "USD"


class EmojiCurrency(str, Enum):
    BEER = "🍺"
    PIZZA = "🍕"
    COFFEE = "☕"


class Currency(BaseModel):
    legal: bool
    type: str = Field(description="USD or emoji currency glyph")

    def balance_key(self) -> str:
        return "USD" if self.legal else self.type
