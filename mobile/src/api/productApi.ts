import axiosClient from './axiosClient';

export const productApi = {
  // Lấy danh sách sản phẩm nổi bật
  getFeaturedProducts: () => {
    return axiosClient.get('/products', {
      params: { limit: 10, is_featured: 1 }
    });
  },
  // Lấy sản phẩm mới nhất
  getNewArrivals: () => {
    return axiosClient.get('/products', {
      params: { limit: 10, sort_by: 'created_at', sort_order: 'DESC' }
    });
  },
  // Lấy danh sách danh mục
  getProductCategories: () => {
    return axiosClient.get('/product-categories');
  },
  // Lấy danh sách sản phẩm (có thể lọc theo danh mục)
  getProducts: (params: any) => {
    return axiosClient.get('/products', { params });
  },
  // Lấy chi tiết sản phẩm
  getProductById: (id: string | number) => {
    return axiosClient.get(`/products/${id}`);
  }
};
