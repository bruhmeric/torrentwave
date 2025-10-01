# Torrent Wave

A sleek and modern user interface to search for torrents using a Jackett backend.

## Features

- Clean, responsive UI for searching torrents.
- Results displayed in a sortable, paginated table.
- Key information at a glance: size, seeders, peers, and publish date.
- Easy magnet link copying.
- Configurable to connect to any Jackett instance.

## Deployment on a VPS

This application is designed to be easily hosted on a server like an Ubuntu VPS.

### Prerequisites

- Node.js (v18 or later recommended)
- npm
- Git

### Deployment Steps

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Jackett connection:**
    Create a `.env` file in the root of the project to configure your Jackett server details. These variables will be used during the build process.

    ```ini
    # .env
    VITE_JACKETT_URL=http://your_jackett_server_ip:9117
    VITE_JACKETT_API_KEY=your_jackett_api_key
    ```
    - Replace `http://your_jackett_server_ip:9117` with the URL of your Jackett instance.
    - Replace `your_jackett_api_key` with your API key from Jackett.

    **Note:** If you change these values, you will need to rebuild the application (step 4).

4.  **Build the application:**
    This command compiles the React application into static files in the `dist` directory.
    ```bash
    npm run build
    ```

5.  **Start the server:**
    The application includes a simple Express server to serve the built files.
    ```bash
    npm start
    ```
    By default, the server runs on port 3000. To specify a different port, use the `PORT` environment variable:
    ```bash
    PORT=8080 npm start
    ```

### Using a Process Manager (Recommended)

For long-running applications in production, it's highly recommended to use a process manager like `pm2`. This will ensure your application restarts automatically if it crashes.

1.  **Install pm2 globally:**
    ```bash
    npm install pm2 -g
    ```

2.  **Start the application with pm2:**
    ```bash
    pm2 start npm --name "torrent-wave" -- start
    ```
    To run on a specific port:
    ```bash
    pm2 start "PORT=8080 npm start" --name "torrent-wave"
    ```
    - Replace `torrent-wave` with your desired app name.
    - Replace `8080` with your desired port.

3.  **Manage your application:**
    - `pm2 list`: List all running applications.
    - `pm2 stop torrent-wave`: Stop the application.
    - `pm2 restart torrent-wave`: Restart the application.
    - `pm2 logs torrent-wave`: View logs.
    - `pm2 startup` & `pm2 save`: To make pm2 restart your app on server reboot.

## Development

To run the application in development mode:

1.  Follow steps 1-3 from the deployment guide.
2.  Run the development server:
    ```bash
    npm run dev
    ```
    This will start a hot-reloading development server, typically on `http://localhost:5173`.
