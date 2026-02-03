
import uvicorn
from main import app
from mangum import Mangum

# For Vercel: Use Mangum to wrap FastAPI app for AWS Lambda/Vercel
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)

