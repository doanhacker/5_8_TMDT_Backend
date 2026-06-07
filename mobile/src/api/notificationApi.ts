import axiosClient from './axiosClient';

export const notificationApi = {
  getMyNotifications: () => {
    return axiosClient.get('/notifications/my');
  },
  readAll: () => {
    return axiosClient.put('/notifications/read-all');
  },
  readOne: (id: string | number) => {
    return axiosClient.put(`/notifications/${id}/read`);
  }
};
