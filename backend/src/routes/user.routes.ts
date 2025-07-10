import { Router } from 'express';

const router = Router();

// TODO: Implement user routes
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint - to be implemented' });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint - to be implemented' });
});

export default router;