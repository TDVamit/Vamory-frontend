import os
import subprocess

def main():
    # Set environment variables
    os.environ["VITE_BACKEND_BASE_URL"] = "http://localhost:8000"
    os.environ["VITE_FRONTEND_URL"] = "http://localhost:5173"
    os.environ["VITE_REDIRECT_URL"] = "http://localhost:5173"

    # Run npm run dev with shell=True so Windows resolves npm.cmd
    try:
        subprocess.run("npm run dev", shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print("Error while starting frontend:", e)

if __name__ == "__main__":
    main()
