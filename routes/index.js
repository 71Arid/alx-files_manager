import AppController from '../controllers/AppController';

const express = require('express');

const routes = express.Router();

routes.get('/status', AppController.getStatus);
routes.get('/stats', AppController.getStats);

module.exports = routes;
