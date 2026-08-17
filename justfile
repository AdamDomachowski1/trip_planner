port := "8741"

# list available recipes
default:
    @just --list

# serve the app locally (no build step — plain static files)
run:
    @echo "http://localhost:{{port}}"
    python3 -m http.server {{port}}

# serve and open the browser
open:
    @open http://localhost:{{port}} &
    @just run

# refresh the country outlines from Natural Earth
data:
    curl -sSL -o data/countries-50m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json
    curl -sSL -o data/countries-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
