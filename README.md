# N-Dimensional Cube Rotation Simulator

This project simulates the rotation of an N-dimensional hypercube (also known as an N-cube or tesseract for N=4) and projects it into 3D space for visualization.

## Features

*   **Variable Dimensions:** Simulate cubes from 3 up to 10 dimensions.
*   **Interactive Rotation:** Control the rotation speed globally and individually for each possible rotation plane (e.g., XY, YZ, XW, YW, ZW planes in 4D).
*   **Projection Types:** Choose between Orthographic and a simple Perspective projection (based on the 4th dimension and higher).
*   **Color Schemes:**
    *   Default: White lines.
    *   Rainbow Edges: Colors edges based on their index.
    *   Depth Cue: Colors edges based on their average depth (Z-coordinate) after projection (brighter = closer).
*   **3D View Controls:** Use the mouse to orbit, pan, and zoom the 3D view of the projected cube.

## How it Works

1.  **Vertex Generation:** Creates the 2<sup>N</sup> vertices of an N-dimensional hypercube centered at the origin.
2.  **Edge Generation:** Determines which pairs of vertices are connected by an edge (vertices that differ in exactly one coordinate).
3.  **Rotation:** Applies N-dimensional rotation matrices to the vertices based on the angles specified for each rotation plane. Angles are continuously updated based on the selected speeds.
4.  **Projection:** Projects the rotated N-dimensional vertices into 3D space.
    *   **Orthographic:** Simply takes the first 3 coordinates (x, y, z).
    *   **Perspective:** Uses the 4th coordinate (w) and higher dimensions to apply a scaling factor to the x, y, and z coordinates, simulating perspective foreshortening.
5.  **Rendering:** Uses the Three.js library to draw the projected edges as lines in a 3D scene.

## Setup and Running

This simulation uses JavaScript Modules (`import`), which require the files to be served via a web server due to browser security policies (CORS). You cannot simply open the `index.html` file directly from your filesystem.

**Steps:**

1.  **Navigate to the Project Directory:**
    Open your terminal or command prompt and change into the directory containing the `index.html` file:
    ```bash
    cd path/to/Lab/Experiments/ndr
    ```

2.  **Start a Local Web Server:**
    If you have Python 3 installed (common on Linux/macOS, installable on Windows), you can use its built-in server. Run one of the following commands in the terminal:
    ```bash
    # Try port 8080 first
    python3 -m http.server 8080
    ```
    If port 8080 is busy, try a different port like 8000:
    ```bash
    python3 -m http.server 8000
    ```
    *(For Python 2, the command is `python -m SimpleHTTPServer 8080`)*

    You should see output like `Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...`. Leave this terminal running.

3.  **Open in Browser:**
    Open your web browser and navigate to the address shown by the server, usually:
    *   `http://localhost:8080` (if you used port 8080)
    *   `http://localhost:8000` (if you used port 8000)

The simulation should load and start running. Use the controls panel to adjust parameters and the mouse to manipulate the 3D view.

## Files

*   `index.html`: The main HTML file containing the structure, UI controls, and embedded styles.
*   `main.js`: Contains all the JavaScript logic for the simulation, including geometry generation, rotation, projection, and rendering using Three.js.
*   `style.css`: Currently minimal, linked by `index.html`. Most styles are embedded in the HTML.
*   `README.md`: This file.
*   `spec.md`: Original draft specification.