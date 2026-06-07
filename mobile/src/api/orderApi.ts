import axiosClient from './axiosClient';

export const orderApi = {
  createOrder: (data: any) => {
    return axiosClient.post('/orders', data);
  },
  getOrders: (params?: any) => {
    return axiosClient.get('/orders', { params });
  },
  getOrderDetail: (id: string | number) => {
    return axiosClient.get(`/orders/${id}`);
  },
  cancelOrder: (id: string | number, reason: string) => {
    return axiosClient.put(`/orders/${id}/status`, { status: 'cancelled', cancellation_reason: reason });
  }
};
