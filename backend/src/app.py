from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health_check():
  return {"status": "ok"}


@app.get("/v1/ping")
def ping():
  return {"message": "pong"}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(app, host="0.0.0.0", port=8080)
