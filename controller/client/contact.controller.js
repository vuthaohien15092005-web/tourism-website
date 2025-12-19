const Contact = require('../../model/Contact');
const sendMailHelpers = require('../../utils/sendMail');

// [POST] /contact - Xử lý form liên hệ
module.exports.submit = async (req, res) => {
    try {
        const { name, email, country, remarks } = req.body;
        
        // Map remarks to message for consistency
        const message = remarks;
        
        // Validation
        if (!name || !email || !country || !remarks) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin');
            return res.redirect(req.get('Referer') || '/');
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash('error', 'Email không hợp lệ');
            return res.redirect(req.get('Referer') || '/');
        }
        
        // Tạo liên hệ mới - chỉ lưu 4 thông tin cơ bản
        const contact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            country: country.trim(),
            message: message.trim()
        });
        
        await contact.save();
        
        // Gửi email xác nhận cho user
        const subject = `Xác nhận liên hệ - Hà Nội Vibes`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin: 0 0 10px 0;">Hà Nội Vibes</h2>
                    <p style="color: #6c757d; margin: 0;">Cảm ơn bạn đã liên hệ với chúng tôi!</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Xác nhận nhận liên hệ</h3>
                    <p style="color: #495057; line-height: 1.6;">Xin chào <strong>${name}</strong>,</p>
                    <p style="color: #495057; line-height: 1.6;">Chúng tôi đã nhận được thông tin liên hệ của bạn và sẽ phản hồi trong thời gian sớm nhất có thể.</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 6px; font-size: 14px; color: #6c757d;">
                    <p style="margin: 0 0 10px 0;"><strong>Thông tin liên hệ của bạn:</strong></p>
                    <p style="margin: 0 0 5px 0;"><strong>Tên:</strong> ${name}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Quốc gia:</strong> ${country}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Tin nhắn:</strong> ${message}</p>
                    <p style="margin: 0;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
                    <p>Email này được gửi tự động từ hệ thống Hà Nội Vibes</p>
                    <p>Vui lòng không trả lời trực tiếp email này.</p>
                </div>
            </div>
        `;
        
        sendMailHelpers.sendMail(email, subject, html);
        
        // Sử dụng flash message và redirect
        req.flash('success', 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
        res.redirect(req.get('Referer') || '/');
        
    } catch (error) {
        console.error('Contact submission error:', error);
        
        req.flash('error', 'Có lỗi xảy ra khi gửi liên hệ. Vui lòng thử lại sau.');
        res.redirect(req.get('Referer') || '/');
    }
};
