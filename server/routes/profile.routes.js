import express, { Router } from 'express';
import * as profile from '../controllers/profile.controller.js';

const r = Router();
r.get('/', profile.show);
r.put('/', profile.update);
r.get('/avatar', profile.avatar);
r.put('/avatar', express.raw({ type: ['image/jpeg', 'image/png'], limit: '120kb' }), profile.saveAvatar);
r.delete('/avatar', profile.removeAvatar);

export default r;
