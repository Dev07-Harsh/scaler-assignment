

const validatePaginationParams = (query) => {
  const errors = [];
  
  // Parse and validate page
  let page = parseInt(query.page) || 1;
  if (page < 1 || !Number.isInteger(page)) {
    page = 1;
  }
  
  // Parse and validate limit
  let limit = parseInt(query.limit) || 10;
  if (limit < 1 || !Number.isInteger(limit)) {
    limit = 10;
  }
  
  // Enforce maximum limit
  if (limit > 100) {
    limit = 100;
  }
  
  return { page, limit, errors };
};

const calculatePagination = (page, limit) => {
  const skip = (page - 1) * limit;
  const take = limit;
  
  return { skip, take };
};

const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

const getPaginationParams = (query) => {
  const { page, limit, errors } = validatePaginationParams(query);
  
  if (errors.length > 0) {
    throw new Error(`Invalid pagination parameters: ${errors.join(', ')}`);
  }
  
  const { skip, take } = calculatePagination(page, limit);
  
  return {
    page,
    limit,
    skip,
    take
  };
};

module.exports = {
  validatePaginationParams,
  calculatePagination,
  formatPaginationResponse,
  getPaginationParams
};