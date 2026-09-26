import * as productService from '../services/productService.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, categoryId, warehouseId, lowStock } = req.query;
    const products = await productService.getProducts({ search, categoryId, warehouseId, lowStock });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const product = await productService.createProduct(req.body, userId);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
