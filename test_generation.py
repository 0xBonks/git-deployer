import os
import requests
import json
import datetime
import time
import shutil

# Configuration
API_URL = "http://localhost:8000"
OUTPUT_DIR = "output"
TEST_REPO = "https://github.com/tiangolo/fastapi"  # FastAPI als Beispielrepository
PLATFORMS = ["AWS", "Azure", "OpenShift", "Docker"]

def clear_output_directory():
    """Löscht alle Dateien im Output-Verzeichnis"""
    print(f"Löschen aller Dateien im Ordner {OUTPUT_DIR}...")
    if os.path.exists(OUTPUT_DIR):
        for file in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, file)
            if os.path.isfile(file_path):
                os.unlink(file_path)
                print(f"  Gelöscht: {file}")
    else:
        os.makedirs(OUTPUT_DIR)
        print(f"  Verzeichnis {OUTPUT_DIR} erstellt")

def test_generate_deployment(platform):
    """Generiert eine Deployment-Anleitung für eine bestimmte Plattform"""
    print(f"\nGeneriere Deployment-Anleitung für {platform}...")
    
    payload = {
        "git_link": TEST_REPO,
        "platform": platform
    }
    
    try:
        response = requests.post(f"{API_URL}/generate_deployment", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Erfolgreich generiert: {data['filename']}")
            
            # Überprüfen, ob die Datei existiert
            file_path = os.path.join(OUTPUT_DIR, data['filename'])
            if os.path.exists(file_path):
                file_stats = os.stat(file_path)
                file_size = file_stats.st_size / 1024  # in KB
                print(f"  Dateigröße: {file_size:.2f} KB")
                
                # Korrektes Jahr 2024 in der Datumsangabe prüfen
                expected_year = "2024"
                if expected_year in data['filename']:
                    print(f"  ✅ Datumsangabe korrekt mit Jahr {expected_year}")
                else:
                    print(f"  ❌ Datumsangabe falsch. Erwartet: Jahr {expected_year}, Gefunden: {data['filename']}")
                
                return True
            else:
                print(f"  ❌ Datei wurde nicht gefunden: {file_path}")
                return False
        else:
            print(f"  ❌ Fehler: {response.status_code} - {response.text}")
            return False
    
    except Exception as e:
        print(f"  ❌ Ausnahme: {str(e)}")
        return False

def main():
    """Hauptfunktion zum Testen der Deployment-Generierung"""
    print("=== Deployment-Anleitung Generierungstest ===")
    print(f"API-URL: {API_URL}")
    print(f"Test-Repository: {TEST_REPO}")
    print(f"Zeitstempel: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Lösche bestehende Dateien
    clear_output_directory()
    
    # Generiere Deployment-Anleitungen für alle Plattformen
    results = {}
    for platform in PLATFORMS:
        time.sleep(1)  # Kleine Pause zwischen den Anfragen
        success = test_generate_deployment(platform)
        results[platform] = success
    
    # Ergebniszusammenfassung
    print("\n=== Testergebnis ===")
    all_success = True
    for platform, success in results.items():
        status = "✅ Erfolgreich" if success else "❌ Fehlgeschlagen"
        print(f"{platform}: {status}")
        if not success:
            all_success = False
    
    # Prüfe, ob alle Dateien im Output-Verzeichnis das Jahr 2024 haben
    print("\n=== Dateiüberprüfung ===")
    expected_year = "2024"
    all_files_correct = True
    
    if os.path.exists(OUTPUT_DIR):
        for file in os.listdir(OUTPUT_DIR):
            if file.endswith(".md"):
                if expected_year in file:
                    print(f"{file}: ✅ Korrekte Datumsangabe mit Jahr {expected_year}")
                else:
                    print(f"{file}: ❌ Falsche Datumsangabe, Jahr {expected_year} nicht gefunden")
                    all_files_correct = False
    
    # Gesamtergebnis
    print("\n=== Gesamtergebnis ===")
    if all_success and all_files_correct:
        print("✅ Alle Tests erfolgreich!")
    else:
        print("❌ Es sind Fehler aufgetreten. Siehe Details oben.")

if __name__ == "__main__":
    main() 