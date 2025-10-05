from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health_check():
  return {"status": "ok"}


@app.get("/")
def root():
  return {"message": "hello, world\n"}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(app, host="0.0.0.0", port=8080)
