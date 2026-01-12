module.exports = {
  apps: [{
    name: 'n8n',
    script: './node_modules/.bin/n8n',
    env: {
      N8N_BASIC_AUTH_ACTIVE: true,
      N8N_BASIC_AUTH_USER: 'admin',
      N8N_BASIC_AUTH_PASSWORD: 'MevoyaJapon2026!Secure',
      N8N_HOST: 'n8n.mevoyajapon.com',
      N8N_PORT: 5678,
      N8N_PROTOCOL: 'https',
      NODE_ENV: 'production',
      N8N_EMAIL_MODE: 'smtp',
      N8N_SMTP_HOST: 'localhost',
      N8N_SMTP_PORT: 25,
      N8N_SMTP_USER: '',
      N8N_SMTP_PASS: '',
      N8N_SMTP_SENDER: 'n8n@mevoyajapon.com',
      N8N_SMTP_SSL: false
    }
  }]
};