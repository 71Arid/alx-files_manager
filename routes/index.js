import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const express = require('express');

const routes = express.Router();
routes.use(express.json());

routes.get('/status', AppController.getStatus);
routes.get('/stats', AppController.getStats);
routes.post('/users', UsersController.postNew);
routes.get('/connect', AuthController.getConnect);
routes.get('/disconnect', AuthController.getDisconnect);
routes.get('/users/me', UsersController.getMe);

module.exports = routes;
