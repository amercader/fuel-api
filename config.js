var config = {};

config.api = {};
config.solr = {};
config.mongodb = {};

config.api.allowedCORSDomains = process.env.ALLOWED_CORS_DOMAINS || 'http://localhost';

config.solr.host = process.env.SOLR_HOST || 'localhost';
config.solr.port = process.env.SOLR_PORT || '8080';
config.solr.core = process.env.SOLR_CORE || 'fuel';

config.mongodb.url = process.env.MONGODB_URL || 'mongodb://localhost:27017/fuel';

module.exports = config;
