# Environment Variables Setup Guide

## 🔒 Security Notice
The `.env` files are now properly protected and will NOT be pushed to git. This guide helps you set up your environment variables correctly.

## Backend Setup

Create a file named `Backend/.env` with the following variables:

```env
# Database Configuration
PGHOST=localhost
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys
PINECONE_API_KEY=your-pinecone-api-key
COHERE_API_KEY=your-cohere-api-key
GROQ_API_KEY=your-groq-api-key

# Optional: Development Settings
DEBUG=False
ENVIRONMENT=development
```

## Frontend Setup

Create a file named `Frontend/.env` with the following variables:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Distill
VITE_ENVIRONMENT=development
```

## 🔧 How to Get API Keys

### Pinecone API Key
1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create/Login to your account
3. Go to "API Keys" section
4. Copy your API key

### Cohere API Key
1. Go to [Cohere Dashboard](https://dashboard.cohere.ai/)
2. Create/Login to your account
3. Go to "API Keys" section
4. Copy your API key

### Groq API Key
1. Go to [Groq Console](https://console.groq.com/)
2. Create/Login to your account
3. Go to "API Keys" section
4. Copy your API key

## 🚀 Quick Start

1. Copy the environment variables above
2. Create the `.env` files in the correct directories
3. Replace placeholder values with your actual credentials
4. Run your application

## ⚠️ Important Notes

- **Never commit `.env` files to git**
- **Use different secrets for production**
- **Rotate your API keys regularly**
- **Keep your JWT secret secure and random**

## 🔍 Verification

To verify your setup is working:

1. **Backend**: Run `python Backend/test_pinecone_connection.py`
2. **Frontend**: Check if the app connects to your backend
3. **Database**: Verify database connection in your logs

## 🆘 Troubleshooting

### Pinecone SSL Errors
- Ensure your Pinecone index region matches your configuration
- Check that your API key is valid
- Verify network connectivity

### Database Connection Issues
- Check database credentials
- Ensure PostgreSQL is running
- Verify database exists

### Missing API Keys
- Check that all required environment variables are set
- Ensure no typos in variable names
- Restart your application after changing `.env` files 