const { Router } = require('express');

const router = new Router();

router.get('/', (_req, res) => {
  res.status(200)
    .setHeader('cache-control', 'no-cache')
    .send({ status: 'available' });
});

module.exports = router;
