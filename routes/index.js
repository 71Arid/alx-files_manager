import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const express = require('express');

const routes = express.Router();
routes.use(express.json());

routes.get('/status', AppController.getStatus);
routes.get('/stats', AppController.getStats);
routes.post('/users', UsersController.postNew);

module.exports = routes;
