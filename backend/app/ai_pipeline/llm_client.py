"""
Thin wrapper around the chosen LLM provider (Groq free tier).
Isolating this behind one function makes it trivial to swap providers later
(OpenAI, Gemini, local Ollama, etc.) without touching the rest of the pipeline.
"""
from groq import Groq
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
def generate(system_prompt: str, user_prompt: str, temperature: float = 0.4, max_tokens: int = 1500) -> str:
    """
    Calls the LLM and returns raw text output.
    Retries on transient failures (rate limits/network) — free-tier APIs need this.
    """
    if _client is None:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to your .env file (see .env.example)."
        )

    extra_kwargs = {}
    if settings.groq_model.startswith("openai/gpt-oss"):
        # gpt-oss are reasoning models: hidden "thinking" tokens share the same
        # max_tokens budget as the visible answer. Keep effort low and hide
        # reasoning output entirely so the full budget goes to the JSON answer.
        # Requires groq SDK >= 0.30.0.
        extra_kwargs["reasoning_effort"] = "low"
        extra_kwargs["include_reasoning"] = False

    response = _client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        **extra_kwargs,
    )
    content = response.choices[0].message.content or ""
    return content.strip()
