const express = require('express');
const authRoutes = require('./authRoutes');
const storeRoutes = require('./storeRoutes');
const staffRoutes = require('./staffRoutes');
const categoryRoutes = require('./categoryRoutes');
const brandRoutes = require('./brandRoutes');
const productRoutes = require('./productRoutes');
const stockRoutes = require('./stockRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/staff', staffRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
