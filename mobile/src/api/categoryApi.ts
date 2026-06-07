import axiosClient from './axiosClient';

export const categoryApi = {
  getAllCategories: () => {
    return axiosClient.get('/product-categories');
  },
  getCategoryById: (id: string | number) => {
    return axiosClient.get(`/product-categories/${id}`);
  },
};
