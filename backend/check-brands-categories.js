const db = require('./config/db');

async function checkBrandsAndCategories() {
    try {
        console.log('🔍 Checking brands...');
        const [brands] = await db.query('SELECT * FROM brands');
        console.log(`✅ Found ${brands.length} brands:`);
        brands.forEach(b => console.log(`  - ${b.brand_id}: ${b.brand_name}`));
        
        console.log('\n🔍 Checking categories...');
        const [categories] = await db.query('SELECT * FROM categories');
        console.log(`✅ Found ${categories.length} categories:`);
        categories.forEach(c => console.log(`  - ${c.category_id}: ${c.category_name}`));
        
        if (brands.length === 0) {
            console.log('\n⚠️  WARNING: No brands found! Run seed.sql first:');
            console.log('   mysql -u root laptop_ecommerce_db < backend/database/seed.sql');
        }
        
        if (categories.length === 0) {
            console.log('\n⚠️  WARNING: No categories found! Run seed.sql first:');
            console.log('   mysql -u root laptop_ecommerce_db < backend/database/seed.sql');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkBrandsAndCategories();
