export const getNotificationEmailHtml = (name: string, message: string, link: string): string => {
    const year = new Date().getFullYear();

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #9333ea 0%, #f97316 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 40px; line-height: 1.6; color: #333; }
            .alert-box { background-color: #f9fafb; border-left: 4px solid #9333ea; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .btn { display: inline-block; background-color: #9333ea; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.2); }
            .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0; font-size: 28px; letter-spacing: 1px;">Planora</h1>
            </div>
            <div class="content">
                <h2 style="color: #111827; margin-top: 0;">New Activity Update</h2>
                <p>Hi <strong>${name || 'User'}</strong>,</p>
                <p>You have a new notification regarding your account activity on Planora.</p>
                
                <div class="alert-box">
                    <p style="margin: 0; font-size: 16px; color: #4b5563;">"${message}"</p>
                </div>

                <div style="text-align: center;">
                    <a href="${link}" class="btn">View Details in App</a>
                </div>
                
                <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link: <br>
                    <span style="color: #9333ea;">${link}</span>
                </p>
            </div>
            <div class="footer">
                <p>&copy; ${year} Planora Team. All rights reserved.</p>
                <p>You are receiving this because you signed up for Planora.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};