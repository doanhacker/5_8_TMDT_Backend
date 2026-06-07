import axiosClient from './axiosClient';

export const userProfileApi = {
  getMyProfile: () => {
    return axiosClient.get('/profile/me');
  },
  updateMyProfile: (data: any) => {
    return axiosClient.put('/profile/me', data);
  },
  getMyAddresses: () => {
    return axiosClient.get('/profile/me/addresses');
  },
  createMyAddress: (data: any) => {
    return axiosClient.post('/profile/me/addresses', data);
  },
  updateMyAddress: (addressId: number | string, data: any) => {
    return axiosClient.put(`/profile/me/addresses/${addressId}`, data);
  },
  deleteMyAddress: (addressId: number | string) => {
    return axiosClient.delete(`/profile/me/addresses/${addressId}`);
  }
};
