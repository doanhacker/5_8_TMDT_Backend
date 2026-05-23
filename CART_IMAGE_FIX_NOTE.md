# Ghi Chu Ve Loi Anh Trong Gio Hang

## Van de

Trong he thong, bang `product_images` duoc thiet ke theo 2 cap anh:

- Anh cap san pham: `variant_id = NULL`
- Anh cap phien ban: `variant_id = <id cua variant>`

Day khong phai la loi du lieu. `variant_id = NULL` la chu dich trong thiet ke database de luu anh chung cho san pham.

## Nguyen nhan loi gio hang khong hien anh

Loi goc nam o backend, khong phai o database.

Truoc khi sua, cac query trong gio hang va mot so man hinh lien quan chi lay anh theo `variant_id`, vi du:

```sql
SELECT image_url
FROM product_images
WHERE variant_id = pv.variant_id AND is_primary = TRUE
LIMIT 1
```

Dieu nay dan den:

- Neu variant co anh rieng: giao dien hien anh binh thuong
- Neu variant khong co anh rieng, nhung san pham co anh cap product (`variant_id IS NULL`): query tra ve `NULL`
- Ket qua la gio hang khong co anh

## Cach sua

Da sua backend de uu tien lay anh theo thu tu:

1. Anh primary cua variant
2. Anh primary cua product
3. Anh dau tien cua product
4. Anh dau tien cua variant

Da ap dung fallback nay bang `COALESCE(...)` trong cac file:

- `backend/models/cartModel.js`
- `backend/models/orderModel.js`
- `backend/models/inventoryModel.js`

## Vi sao sua backend la sua tan goc

Frontend truoc do co the them fallback tam thoi, nhung do chi la xu ly phan ngon.

Sua backend moi la sua dung goc vi:

- API tra ve du lieu anh day du va dung logic nghiep vu
- Gio hang, don hang, ton kho deu dung cung mot quy tac lay anh
- Khong phu thuoc vao frontend phai tu goi them API de "cuu" du lieu

## Ket luan

- `variant_id = NULL` trong bang `product_images` la hop le theo thiet ke
- Loi that su la query backend chi lay anh variant ma khong fallback sang anh product-level
- Da sua backend de xu ly dung ca 2 truong hop
