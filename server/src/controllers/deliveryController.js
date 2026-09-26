import * as deliveryService from '../services/deliveryService.js';

export const getDeliveries = async (req, res, next) => {
  try {
    const { status, warehouseId } = req.query;
    const deliveries = await deliveryService.getAllDeliveries({ status, warehouseId });
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const createDelivery = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const delivery = await deliveryService.createDelivery(req.body, userId);
    res.status(201).json({ success: true, message: 'Delivery order created successfully', data: delivery });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateDelivery(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Delivery order updated successfully', data: delivery });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const validateDelivery = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const delivery = await deliveryService.validateDelivery(req.params.id, userId);
    res.status(200).json({ success: true, message: 'Delivery order validated! Outgoing stock deducted.', data: delivery });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.cancelDelivery(req.params.id);
    res.status(200).json({ success: true, message: 'Delivery order canceled successfully', data: delivery });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
