import { Router } from 'express';

const router = Router();

// TODO: Implement admin routes
router.get('/users', (req, res) => {
  res.json({ message: 'Admin users list endpoint - to be implemented' });
});

router.get('/users/:id', (req, res) => {
  res.json({ message: 'Admin user detail endpoint - to be implemented' });
});

export default router;