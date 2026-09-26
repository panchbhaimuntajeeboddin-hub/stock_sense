import * as ledgerService from '../services/ledgerService.js';

export const getLedgerEntries = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      startDate,
      endDate,
      productId,
      warehouseId,
      locationId,
      type,
      search
    } = req.query;

    const result = await ledgerService.getLedgerEntries({
      page,
      limit,
      startDate,
      endDate,
      productId,
      warehouseId,
      locationId,
      type,
      search
    });

    res.status(200).json({
      success: true,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const getLedgerEntryById = async (req, res, next) => {
  try {
    const entry = await ledgerService.getLedgerEntryById(req.params.id);
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
