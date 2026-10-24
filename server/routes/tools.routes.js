import { Router } from 'express';
import * as todo from '../controllers/todo.controller.js';
import * as message from '../controllers/message.controller.js';
import * as workflow from '../controllers/workflow.controller.js';
import * as community from '../controllers/community.controller.js';

const r = Router();

r.get('/todos', todo.index);
r.post('/todos', todo.create);
r.put('/todos/:id', todo.update);
r.delete('/todos/:id', todo.destroy);

r.get('/messages', message.index);
r.get('/messages/recipients', message.recipients);   // must precede /messages/:id
r.get('/messages/:id', message.show);
r.post('/messages', message.create);
r.delete('/messages/:id', message.destroy);

r.get('/workflows', workflow.index);
r.post('/workflows', workflow.create);
r.put('/workflows/:id', workflow.update);
r.delete('/workflows/:id', workflow.destroy);
r.post('/workflows/:id/submit', workflow.submit);

r.get('/announcements', community.announcements);
r.get('/surveys', community.surveys);
r.post('/surveys/:id/respond', community.respondToSurvey);
r.get('/activity', community.activity);

export default r;
