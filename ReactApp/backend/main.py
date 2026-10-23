from fastapi import FastAPI

from peak_days import get_peak_days

app = FastAPI()

@app.get("/api/peak_days")
def peak_days_endpoint():
    return {"forecast": get_peak_days()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host ="127.0.0.1", port=8000, reload= True)