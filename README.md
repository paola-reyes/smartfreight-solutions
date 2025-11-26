# SmartFreight Solutions

The frontend and backend should be run concurrently with each in its own terminal.

## Installing dependencies  
To install frontend dependencies:
```
cd frontend 
npm install express
npm install leaflet react-leaflet   # maps & map components 
npm install recharts                # charts (line/bar/etc.) 
```

To install backend dependencies:
```
cd backend
npm install express        # HTTP server framework
npm install cors           # Enable Cross-Origin requests 
npm install body-parser    # JSON request bodies 
npm install sqlite3        # SQLite driver 
```

## Running the application
To run frontend:
```
cd frontend
npm start
```

To run backend:
```
cd backend
npm start
```

## Uninstalling the application
To remove node_modules directories:
```
npm install rimraf -g

cd backend
npx rimraf --glob **/node_modules

cd frontend
npx rimraf --glob **/node_modules
```