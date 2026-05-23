require('dotenv').config();
const db = require('./config/db');

async function checkProduct2() {
    try {
        console.log('=== Kiểm tra sản phẩm ID = 2 ===\n');

        // 1. Thông tin cơ bản sản phẩm
        const [product] = await db.query(`
            SELECT p.*, b.brand_name, c.category_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = 2
        `);
        
        if (product.length === 0) {
            console.log('❌ Không tìm thấy sản phẩm ID = 2');
            process.exit(0);
        }
        
        console.log('1. Thông tin sản phẩm:');
        console.log(JSON.stringify(product[0], null, 2));
        
        // 2. Ảnh cấp sản phẩm (product-level images)
        const [productImages] = await db.query(`
            SELECT image_id, image_url, is_primary, variant_id
            FROM product_images
            WHERE product_id = 2 AND variant_id IS NULL
            ORDER BY is_primary DESC, image_id ASC
        `);
        
        console.log('\n2. Ảnh cấp sản phẩm (không thuộc variant):');
        if (productImages.length === 0) {
            console.log('⚠️  KHÔNG CÓ ẢNH CẤP SẢN PHẨM!');
        } else {
            productImages.forEach(img => {
                console.log(`   - Image ID: ${img.image_id}, Primary: ${img.is_primary}, URL: ${img.image_url}`);
            });
        }
        
        // 3. Variants và ảnh của từng variant
        const [variants] = await db.query(`
            SELECT variant_id, sku, cpu_name, ram_gb, storage_gb, color_name, status
            FROM product_variants
            WHERE product_id = 2
        `);
        
        console.log('\n3. Variants:');
        if (variants.length === 0) {
            console.log('⚠️  Không có variant nào');
        } else {
            for (const variant of variants) {
                console.log(`\n   Variant ID: ${variant.variant_id} (${variant.sku})`);
                console.log(`   - CPU: ${variant.cpu_name}, RAM: ${variant.ram_gb}GB, Storage: ${variant.storage_gb}GB`);
                console.log(`   - Color: ${variant.color_name}, Status: ${variant.status}`);
                
                // Lấy ảnh của variant này
                const [variantImages] = await db.query(`
                    SELECT image_id, image_url, is_primary
                    FROM product_images
                    WHERE variant_id = ?
                    ORDER BY is_primary DESC, image_id ASC
                `, [variant.variant_id]);
                
                if (variantImages.length === 0) {
                    console.log(`   - ⚠️  Variant này KHÔNG CÓ ẢNH`);
                } else {
                    console.log(`   - Ảnh của variant:`);
                    variantImages.forEach(img => {
                        console.log(`     * Image ID: ${img.image_id}, Primary: ${img.is_primary}, URL: ${img.image_url}`);
                    });
                }
            }
        }
        
        // 4. Tất cả ảnh liên quan đến product_id = 2
        const [allImages] = await db.query(`
            SELECT image_id, image_url, is_primary, product_id, variant_id
            FROM product_images
            WHERE product_id = 2
            ORDER BY variant_id IS NULL DESC, variant_id ASC, is_primary DESC
        `);
        
        console.log('\n4. TẤT CẢ ẢNH (product_id = 2):');
        if (allImages.length === 0) {
            console.log('❌ KHÔNG CÓ ẢNH NÀO TRONG BẢNG product_images!');
        } else {
            allImages.forEach(img => {
                const type = img.variant_id ? `Variant ${img.variant_id}` : 'Product-level';
                console.log(`   - [${type}] Image ID: ${img.image_id}, Primary: ${img.is_primary}, URL: ${img.image_url}`);
            });
        }
        
        console.log('\n=== Kết luận ===');
        if (productImages.length === 0 && allImages.length === 0) {
            console.log('🔴 Sản phẩm ID=2 KHÔNG CÓ ẢNH NÀO trong bảng product_images.');
            console.log('   → Cần thêm ảnh vào bảng product_images cho sản phẩm này.');
        } else if (productImages.length === 0 && allImages.length > 0) {
            console.log('🟡 Sản phẩm có ảnh trong variants nhưng KHÔNG CÓ ảnh cấp sản phẩm (product-level).');
            console.log('   → Frontend có thể không hiển thị được nếu chỉ tìm primary_product_image_url.');
        } else {
            console.log('✅ Sản phẩm có ảnh. Kiểm tra đường dẫn URL có hoạt động không.');
        }
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        process.exit(0);
    }
}

checkProduct2();
