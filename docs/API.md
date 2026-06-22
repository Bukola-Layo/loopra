# Loopra API Documentation

The Loopra API allows you to programmatically manage forms, webhooks, and embedded components.

## Base URL
All API requests should be made to: `https://api.loopra.com` (or your specific tenant subdomain).

## Authentication
Currently, the public API uses API keys passed via the `Authorization` header.
```
Authorization: Bearer <your_api_key>
```
*Note: Some endpoints, like form submissions, do not require authentication if they are public.*

---

## Endpoints

### 1. Forms

#### Submit a Form
**POST** `/api/forms/:id/submit`

Submits data to a specific form and adds the user to your audience list.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "subscriberId": "sub_12345"
}
```

### 2. Webhooks

#### Receive Webhook Events
Loopra sends POST requests to your configured webhook URLs when specific events occur in your workspace (e.g., a new subscriber joins, a campaign is sent).

**Headers:**
- `X-Loopra-Signature`: Used to verify the payload.

**Payload Format:**
```json
{
  "event": "subscriber.created",
  "data": {
    "id": "sub_12345",
    "email": "user@example.com",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3. Embeds
Our embed scripts load directly into your website. They use the `/api/embed` endpoint internally to fetch form configurations and styles without requiring API keys.
