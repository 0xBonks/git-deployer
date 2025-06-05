from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import base64
import httpx
import openai
from dotenv import load_dotenv
import os
import datetime
import threading
import time
import shutil
from pathlib import Path
from typing import List

# Create output directory if it doesn't exist
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI()

# CORS configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the output directory as a static files directory
app.mount("/files", StaticFiles(directory=OUTPUT_DIR), name="files")

# Models for Request and Response
class DeploymentRequest(BaseModel):
    git_link: str
    platform: str

class DeploymentResponse(BaseModel):
    content: str
    filename: str
    file_path: str

class OutputFile(BaseModel):
    filename: str
    platform: str
    created_at: str
    file_path: str

# Settings and helper functions from getApiAccess.py
load_dotenv(dotenv_path='.env')

basic_auth = True
cert_path = 'ca-bundle.crt'

def generate_base64_string(username, password):
    sample_string = f"{username}:{password}"
    sample_string_bytes = sample_string.encode("ascii")
    base64_bytes = base64.b64encode(sample_string_bytes)
    base64_string = base64_bytes.decode("ascii")
    return base64_string

def show_progress_bar(description="Processing"):
    """Display a simple progress bar in the terminal."""
    animation = "|/-\\"
    idx = 0
    while not show_progress_bar.completed:
        print(f"\r{description}... {animation[idx % len(animation)]}", end="")
        idx += 1
        time.sleep(0.1)
    print("\rCompleted!")

show_progress_bar.completed = False

def setup_openai_client():
    if basic_auth:
        username = os.getenv("GPT_USERNAME")
        password = os.getenv("GPT_PASSWORD")
        if not username or not password:
            raise ValueError("Missing environment variables: 'GPT_USERNAME' or 'GPT_PASSWORD'")
        
        token = generate_base64_string(username, password)
        headers = {
            'Authorization': f"Basic {token}"
        }
    else:
        token = '<generated-token-from-url>'
        headers = {
            'Authorization': f"Bearer {token}",
        }

    client = openai.OpenAI(
        api_key=token,
        base_url='https://gpt4ifx.icp.infineon.com',
        default_headers=headers,
        http_client=httpx.Client(verify=cert_path)
    )
    return client

@app.post("/generate_deployment", response_model=DeploymentResponse)
async def generate_deployment(request: DeploymentRequest):
    try:
        # Initialize OpenAI Client
        client = setup_openai_client()
        
        # Load prompt from file and customize
        with open("prompt.txt", "r") as file:
            base_prompt = file.read()
        
        base_prompt = base_prompt.replace("{{git_link}}", request.git_link)
        base_prompt = base_prompt.replace("{{platform}}", request.platform)
        
        # Start Progress Bar (for server logging)
        show_progress_bar.completed = False
        progress_thread = threading.Thread(
            target=show_progress_bar, 
            args=(f"Generating deployment instructions for {request.platform}",)
        )
        progress_thread.start()
        
        try:
            # Send request to OpenAI
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "user", "content": base_prompt}
                ]
            )
        finally:
            show_progress_bar.completed = True
            progress_thread.join()
        
        # Process response
        content = response.choices[0].message.content
        
        # Korrigiertes Datum verwenden, da die Systemzeit falsch ist (2025 statt 2024)
        current_time = datetime.datetime.now()
        
        # Manuell das Jahr 2024 verwenden
        correct_year = 2024
        month = current_time.month
        day = current_time.day
        hour = current_time.hour
        minute = current_time.minute
        second = current_time.second
        
        # Formatieren der korrekten Zeitangabe
        timestamp = f"{correct_year}{month:02d}{day:02d}_{hour:02d}{minute:02d}{second:02d}"
        
        # Log the date format for debugging
        print(f"Generated timestamp: {timestamp}")
        
        # Sanitize platform name for filename
        platform_name = request.platform.lower().replace(' ', '_')
        filename = f"deployment_{platform_name}_{timestamp}.md"
        
        # Save file to output directory
        file_path = os.path.join(OUTPUT_DIR, filename)
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        
        # Return response with file path for frontend use
        return DeploymentResponse(
            content=content, 
            filename=filename,
            file_path=f"/files/{filename}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/platforms")
async def get_platforms():
    return {"platforms": ["AWS", "Azure", "OpenShift", "Docker"]}

@app.get("/output_files", response_model=List[OutputFile])
async def list_output_files():
    """List all markdown files in the output directory with their metadata."""
    try:
        files = []
        for file_path in Path(OUTPUT_DIR).glob("*.md"):
            filename = file_path.name
            # Extract platform name from filename
            parts = filename.split("_")
            if len(parts) >= 2 and filename.startswith("deployment_"):
                platform = parts[1].capitalize()
            else:
                platform = "Unknown"
            
            # Get file creation time
            created_at = datetime.datetime.fromtimestamp(os.path.getctime(file_path)).strftime("%Y-%m-%d %H:%M:%S")
            
            files.append(OutputFile(
                filename=filename,
                platform=platform,
                created_at=created_at,
                file_path=f"/files/{filename}"
            ))
        
        # Sort by creation time (newest first)
        files.sort(key=lambda x: x.created_at, reverse=True)
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/output_files/{filename}")
async def delete_output_file(filename: str):
    """Delete a specific file from the output directory."""
    try:
        file_path = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"message": f"File {filename} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/output_files")
async def clear_output_directory():
    """Delete all files in the output directory."""
    try:
        for file_path in Path(OUTPUT_DIR).glob("*.md"):
            os.remove(file_path)
        return {"message": "All files deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 