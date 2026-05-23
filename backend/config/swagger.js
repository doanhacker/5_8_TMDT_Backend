const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerServerUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

// Cấu hình OpenAPI 3.0
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Laptop E-commerce API',
            version: '1.0.0',
            description: 'API Documentation cho hệ thống E-commerce bán laptop',
            contact: {
                name: 'API Support',
                email: 'support@laptop-shop.com'
            },
        },
        servers: [
            {
                url: swaggerServerUrl,
                description: 'Development server'
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'API đăng ký và đăng nhập người dùng'
            },
            {
                name: 'Products',
                description: 'API quản lý sản phẩm và biến thể sản phẩm'
            },
            {
                name: 'Product Categories',
                description: 'API quản lý danh mục sản phẩm'
            },
            {
                name: 'Brands',
                description: 'API quản lý thương hiệu laptop'
            },
            {
                name: 'Sliders',
                description: 'API quản lý banner sliders'
            },
            {
                name: 'Blog Categories',
                description: 'API quản lý danh mục tin tức'
            },
            {
                name: 'Blog Posts',
                description: 'API quản lý bài viết tin tức'
            }
        ],
        components: {
            schemas: {
                Slider: {
                    type: 'object',
                    required: ['title', 'image_url'],
                    properties: {
                        slider_id: {
                            type: 'integer',
                            description: 'ID tự động tăng của slider',
                            example: 1
                        },
                        title: {
                            type: 'string',
                            description: 'Tiêu đề của slider',
                            example: 'Summer Sale 2024'
                        },
                        image_url: {
                            type: 'string',
                            description: 'URL hình ảnh slider',
                            example: 'https://example.com/banner.jpg'
                        },
                        link_url: {
                            type: 'string',
                            description: 'URL liên kết khi click vào slider',
                            example: 'https://example.com/sale'
                        },
                        display_order: {
                            type: 'integer',
                            description: 'Thứ tự hiển thị',
                            example: 1
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Trạng thái kích hoạt',
                            example: true
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian tạo'
                        }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Lấy dữ liệu thành công'
                        },
                        data: {
                            type: 'object'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Lỗi máy chủ nội bộ'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        user_id: {
                            type: 'integer',
                            description: 'ID người dùng',
                            example: 1
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email đăng nhập',
                            example: 'user@example.com'
                        },
                        full_name: {
                            type: 'string',
                            description: 'Họ và tên',
                            example: 'Nguyễn Văn A'
                        },
                        phone_number: {
                            type: 'string',
                            description: 'Số điện thoại',
                            example: '0901234567'
                        },
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'LOCKED'],
                            description: 'Trạng thái tài khoản',
                            example: 'ACTIVE'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian tạo tài khoản'
                        }
                    }
                },
                BlogCategory: {
                    type: 'object',
                    required: ['category_name'],
                    properties: {
                        category_id: {
                            type: 'integer',
                            description: 'ID danh mục',
                            example: 1
                        },
                        category_name: {
                            type: 'string',
                            description: 'Tên danh mục',
                            example: 'Khuyến mãi'
                        },
                        description: {
                            type: 'string',
                            description: 'Mô tả danh mục',
                            example: 'Tin khuyến mãi, ưu đãi'
                        },
                        post_count: {
                            type: 'integer',
                            description: 'Số lượng bài viết trong danh mục',
                            example: 5
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian tạo'
                        }
                    }
                },
                BlogPost: {
                    type: 'object',
                    required: ['title', 'content_html'],
                    properties: {
                        post_id: {
                            type: 'integer',
                            description: 'ID bài viết',
                            example: 1
                        },
                        category_id: {
                            type: 'integer',
                            description: 'ID danh mục',
                            example: 1
                        },
                        author_id: {
                            type: 'integer',
                            description: 'ID tác giả',
                            example: 1
                        },
                        title: {
                            type: 'string',
                            description: 'Tiêu đề bài viết',
                            example: 'Top 5 Laptop Gaming 2026'
                        },
                        thumbnail_url: {
                            type: 'string',
                            description: 'URL hình ảnh thumbnail',
                            example: 'https://example.com/image.jpg'
                        },
                        content_html: {
                            type: 'string',
                            description: 'Nội dung HTML của bài viết',
                            example: '<p>Nội dung bài viết...</p>'
                        },
                        view_count: {
                            type: 'integer',
                            description: 'Số lượt xem',
                            example: 100
                        },
                        status: {
                            type: 'string',
                            enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'],
                            description: 'Trạng thái bài viết',
                            example: 'PUBLISHED'
                        },
                        published_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Thời gian xuất bản'
                        },
                        category_name: {
                            type: 'string',
                            description: 'Tên danh mục',
                            example: 'Khuyến mãi'
                        },
                        author_name: {
                            type: 'string',
                            description: 'Tên tác giả',
                            example: 'Admin'
                        }
                    }
                },
                ProductCategory: {
                    type: 'object',
                    properties: {
                        category_id: {
                            type: 'integer',
                            example: 1
                        },
                        category_name: {
                            type: 'string',
                            example: 'Laptop Gaming'
                        },
                        parent_category_id: {
                            type: 'integer',
                            nullable: true,
                            example: null
                        }
                    }
                },
                Brand: {
                    type: 'object',
                    properties: {
                        brand_id: {
                            type: 'integer',
                            example: 1
                        },
                        brand_name: {
                            type: 'string',
                            example: 'ASUS'
                        },
                        logo_url: {
                            type: 'string',
                            nullable: true,
                            example: 'https://example.com/asus-logo.png'
                        },
                        product_count: {
                            type: 'integer',
                            description: 'Số lượng sản phẩm của thương hiệu',
                            example: 15
                        }
                    }
                }
            }
        }
    },
    // Đường dẫn tới các file chứa JSDoc comments
    apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerUi, swaggerSpec };
