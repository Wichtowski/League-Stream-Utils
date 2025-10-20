#!/usr/bin/env python3
"""
Build script to create executable from league_collector.py
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def install_pyinstaller():
    """Install PyInstaller if not already installed"""
    try:
        import PyInstaller
        print("✅ PyInstaller already installed")
        return True
    except ImportError:
        print("📦 Installing PyInstaller...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
            print("✅ PyInstaller installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install PyInstaller: {e}")
            return False

def create_executable():
    """Create executable using PyInstaller"""
    print("🔨 Building executable...")
    
    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",  # Create a single executable file
        "--name", "LeagueDataCollector",
        "--add-data", "requirements.txt;.",  # Include requirements.txt
        "--hidden-import", "pymongo",
        "--hidden-import", "requests",
        "--hidden-import", "urllib3",
        "--console",  # Keep console window for output
        "league_collector.py"
    ]
    
    try:
        subprocess.check_call(cmd)
        print("✅ Executable created successfully!")
        print("📁 Output location: dist/LeagueDataCollector.exe")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create executable: {e}")
        return False

def cleanup():
    """Clean up build artifacts"""
    print("🧹 Cleaning up build artifacts...")
    
    # Remove build directory
    if os.path.exists("build"):
        shutil.rmtree("build")
        print("🗑️  Removed build/ directory")
    
    # Remove spec file
    if os.path.exists("LeagueDataCollector.spec"):
        os.remove("LeagueDataCollector.spec")
        print("🗑️  Removed .spec file")

def main():
    """Main build process"""
    print("🎮 League Data Collector - Build Script")
    print("=" * 50)
    
    # Check if league_collector.py exists
    if not os.path.exists("league_collector.py"):
        print("❌ league_collector.py not found in current directory")
        return False
    
    # Install PyInstaller
    if not install_pyinstaller():
        return False
    
    # Create executable
    if not create_executable():
        return False
    
    # Cleanup
    cleanup()
    
    print("\n🎉 Build completed successfully!")
    print("📁 Executable location: dist/LeagueDataCollector.exe")
    print("\n📋 Usage instructions:")
    print("1. Run: LeagueDataCollector.exe")
    print("2. Enter Match ID when prompted")
    print("3. Enter MongoDB URI when prompted")
    print("4. The collector will start polling every 1 second")
    print("5. Press Ctrl+C to stop")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

