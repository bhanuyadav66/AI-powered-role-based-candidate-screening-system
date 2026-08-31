"""
Run this once (and again whenever the source PDFs change) to build the vector
index for every role's knowledge base.

Usage:
    python ingest_kb.py

Before running: place the relevant PDFs from the assignment's resource list into:
    knowledge_base/ai_ml/      (e.g. Tom Mitchell - Machine Learning.pdf)
    knowledge_base/backend/    (a backend-systems reference of your choice)
"""
from app.config import settings
from app.ai_pipeline.ingestion import ingest_role

if __name__ == "__main__":
    print("Starting knowledge base ingestion...\n")

    for role, kb_folder in settings.role_kb_map.items():
        collection_name = f"kb_{kb_folder}"
        print(f"=== Role: {role} (collection: {collection_name}) ===")
        try:
            count = ingest_role(kb_folder, collection_name)
            print(f"Done: {count} chunks stored for '{role}'.\n")
        except FileNotFoundError as e:
            print(f"Skipped: {e}\n")

    print("Ingestion complete.")
