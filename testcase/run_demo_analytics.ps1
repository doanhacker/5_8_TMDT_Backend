# Chạy seed demo 20 sản phẩm + doanh thu analytics
# Yêu cầu: XAMPP MySQL đang bật, database laptop_ecommerce_db

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
node testcase/seed_demo_analytics.mjs
