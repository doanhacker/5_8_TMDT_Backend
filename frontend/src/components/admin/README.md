# Admin Component Structure

Trang Admin đã được chia thành các component nhỏ để dễ quản lý và maintain.

## Cấu trúc folder

```
src/
├── pages/
│   └── Admin.jsx                    ← Main component (state + navigation)
└── components/
    └── admin/
        ├── AdminDashboard.jsx       ← Dashboard & Statistics
        ├── AdminProducts.jsx        ← Product Management (add, edit, delete, search)
        ├── AdminInventory.jsx       ← Stock & Inventory Management
        ├── AdminOrders.jsx          ← Order Management
        ├── AdminCustomers.jsx       ← Customer Management
        ├── AdminContent.jsx         ← Comments & Ads Management
        ├── AdminRecommendation.jsx  ← Recommendation System
        ├── AdminAssistant.jsx       ← AI Assistant Management
        ├── AdminStaff.jsx           ← Staff/User Management
        └── OrderDetailModal.jsx     ← Order Detail Modal
```

## Mô tả từng component

### AdminDashboard.jsx
- Hiển thị dashboard với các KPI
- Doanh thu ngày/tháng/năm
- Các báo cáo khách hàng và pre-order
- Chart thống kê nhanh

**Props:**
```jsx
revenueSummary = {
  day, month, year,
  completedOrders, cancelRate, avgOrder,
  returnRate, preOrders, preOrderCancelRate,
  waitingAverageDays, brandAsus, priceSegmentMid
}
```

### AdminProducts.jsx
- Form thêm/sửa sản phẩm
- Danh sách sản phẩm với search
- Chỉnh sửa, xóa sản phẩm
- Quản lý chi tiết cấu hình laptop

**Props:**
```jsx
products, filteredProducts, searchTerm, setSearchTerm,
productForm, setProductForm,
editingProductId, setEditingProductId,
handleProductSubmit, handleEditProduct, handleDeleteProduct
```

### AdminInventory.jsx
- Form nhập kho
- Chọn sản phẩm, chi nhánh, số lượng
- Cảnh báo kho dưới mức tối thiểu

**Props:**
```jsx
products, stockForm, setStockForm,
handleStockImport, lowStockItems
```

### AdminOrders.jsx
- Quản lý danh sách đơn hàng
- Thay đổi trạng thái đơn hàng
- Xem chi tiết, xác nhận, xuất hóa đơn, hoàn tiền

**Props:**
```jsx
orders, updateOrderStatus, setSelectedOrder
```

### AdminCustomers.jsx
- Danh sách khách hàng
- Phân loại khách (Mới, Thân thiết, VIP)
- Khóa/mở khóa khách hàng

**Props:**
```jsx
customers, handleCustomerSegment, toggleCustomerLock
```

### AdminContent.jsx
- Duyệt bình luận/đánh giá (pending, visible, hidden)
- Quản lý quảng cáo & nội dung trang chủ

**Props:**
```jsx
comments, updateCommentStatus, removeComment,
ads, toggleAdStatus
```

### AdminRecommendation.jsx
- Thống kê sản phẩm được gợi ý
- Thiết lập chiến lược gợi ý (hành vi, bán chạy, hybrid)

**Props:**
```jsx
recommendationStats, recommendationStrategy, setRecommendationStrategy
```

### AdminAssistant.jsx
- Lịch sử trợ lý AI
- Điều chỉnh dữ liệu huấn luyện
- Xem thống kê tương tác & tỷ lệ chuyển đổi

**Props:**
```jsx
aiLogs, aiStats, aiTrainingNote, setAiTrainingNote
```

### AdminStaff.jsx
- Tạo tài khoản nhân viên
- Danh sách người dùng hệ thống
- Gán role (CSKH, Bán hàng, Kho, Admin)

**Props:**
```jsx
staffUsers, newStaff, setNewStaff, createStaff
```

### OrderDetailModal.jsx
- Modal hiển thị chi tiết đơn hàng
- Thông tin khách hàng, sản phẩm, tổng tiền

**Props:**
```jsx
selectedOrder, setSelectedOrder
```

## Cách sử dụng & mở rộng

### Thêm component mới
1. Tạo file trong `src/components/admin/`
2. Export component
3. Import trong `Admin.jsx`
4. Thêm vào `renderModule()` function

### Sửa component
- Mỗi component independent, chỉ cần sửa file riêng
- State chính vẫn ở `Admin.jsx` để quản lý tập trung

### Thêm tính năng
- Nếu là feature của một module → thêm vào component đó
- Nếu liên quan nhiều module → thêm state vào `Admin.jsx` và pass prop

## Benefits

✅ **Easy to Maintain** - Mỗi feature là một file riêng  
✅ **Easy to Scale** - Thêm module mới không ảnh hưởng cũ  
✅ **Easy to Test** - Component nhỏ dễ unit test hơn  
✅ **Reusable** - Component có thể dùng lại trong trang khác  
✅ **Better Performance** - Code splitting tốt hơn  

## Development Tips

- Giữ state ở `Admin.jsx` (parent component)
- Pass handler function qua props
- Mỗi component chỉ render UI + call handler
- Không hardcode data - lấy từ props
