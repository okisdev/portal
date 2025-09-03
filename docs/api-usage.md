# API Usage Guide

## Authentication

All API requests require authentication using API keys. Include your API key in the Authorization header:

```
Authorization: Bearer pk_your_api_key_here
```

## Contact Upload API

### Endpoint
```
POST /api/v1/contact/upload
```

### Headers
```
Content-Type: application/json
Authorization: Bearer pk_your_api_key_here
```

### Required Permissions
- `write:contacts` - Required to create contacts via API

### Request Body
```json
{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "12345678",
      "company": "Example Corp",
      "source": "API",
      "status": "Lead",
      "remark": "Imported via API",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Field Descriptions
- `firstName` (required): Contact's first name
- `lastName` (optional): Contact's last name
- `email` (optional): Email address (either email or phone required)
- `phone` (optional): Phone number (either email or phone required)
- `company` (optional): Company name
- `companyId` (optional): ID of existing company
- `source` (optional): Contact source (defaults to "API")
- `status` (optional): Contact status (defaults to "Lead")
- `remark` (optional): Additional notes
- `createdAt` (optional): Creation date (ISO string or YYYY/MM/DD format)

### Response
```json
{
  "success": true,
  "data": {
    "created": [
      {
        "id": "contact-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      }
    ],
    "skipped": [
      {
        "firstName": "Jane",
        "email": "existing@example.com",
        "reason": "Duplicate email"
      }
    ],
    "errors": [],
    "summary": {
      "total": 2,
      "created": 1,
      "skipped": 1,
      "errors": 0
    }
  }
}
```

### Error Responses

#### Authentication Error (401)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

#### Permission Error (403)
```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Missing required permission: write:contacts"
  }
}
```

#### Validation Error (400)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "contacts": ["At least one contact is required"]
    }
  }
}
```

## Example Usage

### cURL
```bash
curl -X POST https://your-domain.com/api/v1/contact/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_your_api_key_here" \
  -d '{
    "contacts": [
      {
        "firstName": "John",
        "lastName": "Doe", 
        "email": "john@example.com",
        "phone": "12345678",
        "company": "Example Corp"
      }
    ]
  }'
```

### JavaScript/Node.js
```javascript
const response = await fetch('/api/v1/contact/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer pk_your_api_key_here'
  },
  body: JSON.stringify({
    contacts: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '12345678',
        company: 'Example Corp'
      }
    ]
  })
});

const result = await response.json();
```

### Python
```python
import requests

url = 'https://your-domain.com/api/v1/contact/upload'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer pk_your_api_key_here'
}
data = {
    'contacts': [
        {
            'firstName': 'John',
            'lastName': 'Doe',
            'email': 'john@example.com',
            'phone': '12345678',
            'company': 'Example Corp'
        }
    ]
}

response = requests.post(url, json=data, headers=headers)
result = response.json()
```

## Notes

- Maximum 1000 contacts per request
- Duplicate contacts (same email or phone) are automatically skipped
- Phone numbers are automatically formatted for Hong Kong (+852)
- All API keys track usage statistics automatically
- Invalid contacts are reported in the errors array but don't fail the entire request
