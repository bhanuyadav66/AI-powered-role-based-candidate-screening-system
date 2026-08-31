from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration. All values are overridable via .env / real env vars,
    so nothing environment-specific is hardcoded in the codebase.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "sqlite:///./app.db"

    # Vector store / knowledge base
    vector_store_dir: str = "./vector_store"
    knowledge_base_dir: str = "./knowledge_base"

    # Embeddings
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # LLM (Groq)
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"

    # RAG tuning
    chunk_size_tokens: int = 500
    chunk_overlap_tokens: int = 75
    top_k_per_query: int = 2
    questions_per_session: int = 6

    # CORS
    frontend_origin: str = "http://localhost:3000"

    # Supported roles -> knowledge base subfolder mapping
    role_kb_map: dict = {
        "ai_ml_engineer": "ai_ml",
        "backend_engineer": "backend",
    }


settings = Settings()
