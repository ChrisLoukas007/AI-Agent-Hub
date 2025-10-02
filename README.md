# AI Agent Hub

**Dockerized, MCP-enabled, RAG-powered assistant with streaming APIs, experiment tracking, and a production-minded React UI.**

---

## 🚀 Overview

AI Agent Hub is a **production-ready AI assistant platform** that demonstrates modern agent plumbing, retrieval-augmented generation (RAG), observability, and cloud-native deployment.  

Key highlights:
- **MCP (Model Context Protocol):** Custom tool server + optional client adapter.  
- **RAG system:** Source-grounded answers via **Qdrant** vector DB.  
- **Local LLMs:** Run **Llama-3.1-8B** with **Ollama** (free, no API costs).  
- **Production-grade stack:** Docker Compose, FastAPI (SSE streaming), React + Vite UI, MLflow tracking, CI/CD to Google Cloud Run.  

This project is structured to showcase **multi-service orchestration**—exactly what hiring managers look for in modern AI engineering.

---

## 🛠️ Tech Stack

- **LLM:** [Ollama](https://ollama.ai) + `llama3.1:8b`  
- **Agent Protocol:** [MCP](https://modelcontextprotocol.io) (server + optional client shim)  
- **RAG Framework:** [LangChain](https://www.langchain.com/) or custom lightweight code  
- **Vector DB:** [Qdrant](https://qdrant.tech) (Docker or Cloud free tier)  
- **API:** [FastAPI](https://fastapi.tiangolo.com/) + SSE for streaming tokens  
- **Frontend:** React + Vite (TypeScript)  
- **Observability:** [MLflow](https://mlflow.org) for experiment tracking & evals  
- **Containers:** Docker + Docker Compose  
- **Cloud Deploy:** Google Cloud Run (free tier) + optional Qdrant Cloud + Cloudflare Workers AI  
- **CI/CD:** GitHub Actions (CI + deploy pipelines)

---

## 📂 Repository Structure

