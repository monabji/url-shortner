# URL Shortener

A full-stack URL shortener built with **Express.js** and **React.js**.

The application accepts a long URL, generates a shorter link, and redirects visitors from the short link to the original destination.

## Features

- Create short URLs from long URLs
- Redirect short URLs to their original destinations
- React-based frontend
- Express.js backend API
- Simple foundation for adding analytics, authentication, expiration dates, and custom aliases

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js and Express.js
- **API format:** REST/JSON
- **Database:** Configure the database used by your implementation

## Project Structure

```text
.
├── client/       # React frontend
├── server/       # Express backend
└── README.md
```

> If your project uses different folder names, update this section to match the repository structure.

## Prerequisites

- Node.js 18 or newer
- npm or another Node.js package manager
- A database, if required by the backend implementation

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd <project-directory>
```

Install frontend and backend dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the backend directory. The exact variables depend on the database and deployment configuration. A typical setup may include:

```env
PORT=5000
DATABASE_URL=<your-database-connection-string>
CLIENT_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

Do not commit `.env` files or production secrets to version control.

### Run the Application

Start the Express server:

```bash
cd server
npm run dev
```

Start the React development server in a second terminal:

```bash
cd client
npm start
```

The frontend is typically available at `http://localhost:3000`, and the API at `http://localhost:5000`.

## API Overview

The backend should expose endpoints similar to these:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/urls` | Create a short URL |
| `GET` | `/:shortCode` | Redirect to the original URL |
| `GET` | `/api/urls/:shortCode` | Retrieve short URL details, if supported |

Example request:

```http
POST /api/urls
Content-Type: application/json

{
  "originalUrl": "https://example.com/a/very/long/url"
}
```

Example response:

```json
{
  "shortCode": "abc123",
  "shortUrl": "http://localhost:5000/abc123",
  "originalUrl": "https://example.com/a/very/long/url"
}
```

## Production Build

Build the React application:

```bash
cd client
npm run build
```

Configure Express to serve the generated frontend files, set production environment variables, and start the server using the production script defined in `server/package.json`.

## Testing

Run the test commands defined by each package:

```bash
cd server
npm test

cd ../client
npm test
```

## Security Considerations

- Validate that submitted values are valid HTTP or HTTPS URLs.
- Protect against open redirects and malicious destinations.
- Add rate limiting to the URL creation endpoint.
- Use secure, randomly generated short codes.
- Keep database credentials and other secrets in environment variables.

## License

Add the project license here, for example `MIT`.
