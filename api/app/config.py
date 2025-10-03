from pydantic_settings import BaseSettings, SettingsConfigDict

# it stores all the important settings in one place


class Settings(BaseSettings):
    api_port: int = 8000
    vector_db_url: str = "http://localhost:6333"  # URL of the Qdrant vector database server
    qdrant_collection: str = "agenthub"  # name of the collection in Qdrant where vectors are stored
    llm_model: str = "llama3.1:8b"
    ollama_host: str = "http://localhost:11434"
    mlflow_tracking_uri: str | None = None

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
